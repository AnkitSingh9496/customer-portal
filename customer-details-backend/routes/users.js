import express from "express";
import axios from "axios";
import { pool } from "../db.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/seed", async (req, res) => {
  try {
    const response = await axios.get(process.env.RANDOM_USER_API_URL);

    const users = response.data.results;

    const seed = response.data.info.seed;

    if (!users.length) {
      return res.json({
        message: "No users found",
      });
    }

    const values = users.flatMap((user) => {
      console.log(user.phone);

      console.log(user.location.city);

      console.log(user.location.state);

      return [
        user.login.uuid,

        user.name.first,

        user.name.last,

        user.email,

        user.phone,

        user.location.city,

        user.location.state,

        user.location.country,

        user.registered.date,
        seed,
      ];
    });

    const rowPlaceholders = users
      .map((_, i) => {
        const offset = i * 10;

        return `(
          $${offset + 1},
          $${offset + 2},
          $${offset + 3},
          $${offset + 4},
          $${offset + 5},
          $${offset + 6},
          $${offset + 7},
          $${offset + 8},
          $${offset + 9},
          $${offset + 10}
        )`;
      })
      .join(",");

    await pool.query(
      `
      INSERT INTO users (
        uuid,
        first_name,
        last_name,
        email,
        phone,
        city,
        state,
        country,
        registered_date,
        api_seed
      )
      VALUES ${rowPlaceholders}
      `,
      values,
    );

    const totalResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM users
    `);

    res.json({
      message: "Users inserted successfully",
      seed,
      totalUsers: totalResult.rows[0].total,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH active_users AS (
    
        SELECT *
        FROM users
        WHERE COALESCE(is_merged, FALSE) = FALSE
    
      ),
    
      duplicate_matches AS (
    
        SELECT
          u1.id,
          u1.uuid,
    
          CASE
    
            WHEN EXISTS (
              SELECT 1
              FROM active_users u2
              WHERE
                u1.uuid <> u2.uuid
                AND LOWER(u1.email) = LOWER(u2.email)
            )
            THEN LOWER(u1.email)
    
            WHEN EXISTS (
              SELECT 1
              FROM active_users u2
              WHERE
                u1.uuid <> u2.uuid
                AND u1.phone IS NOT NULL
                AND u1.phone = u2.phone
            )
            THEN u1.phone
    
            WHEN EXISTS (
              SELECT 1
              FROM active_users u2
              WHERE
                u1.uuid <> u2.uuid
                AND LOWER(u1.first_name) = LOWER(u2.first_name)
                AND LOWER(u1.last_name) = LOWER(u2.last_name)
                AND LOWER(COALESCE(u1.city, '')) =
                    LOWER(COALESCE(u2.city, ''))
                AND LOWER(COALESCE(u1.state, '')) =
                    LOWER(COALESCE(u2.state, ''))
            )
            THEN CONCAT(
              LOWER(u1.first_name),
              '_',
              LOWER(u1.last_name),
              '_',
              LOWER(COALESCE(u1.city, '')),
              '_',
              LOWER(COALESCE(u1.state, ''))
            )
    
            ELSE NULL
    
          END AS duplicate_group
    
        FROM active_users u1
      ),
    
      duplicate_counts AS (
    
        SELECT
          duplicate_group,
    
          GREATEST(COUNT(*) - 1, 0) AS total_duplicates
    
        FROM duplicate_matches
    
        WHERE duplicate_group IS NOT NULL
    
        GROUP BY duplicate_group
      )
    
      SELECT
        u.*,
    
        dm.duplicate_group,
    
        CASE
          WHEN dc.total_duplicates > 0
          THEN CONCAT(dc.total_duplicates, ' duplicates')
          ELSE '0'
        END AS total_duplicates
    
      FROM active_users u
    
      LEFT JOIN duplicate_matches dm
        ON u.uuid = dm.uuid
    
      LEFT JOIN duplicate_counts dc
        ON dm.duplicate_group = dc.duplicate_group
    
      ORDER BY
        dc.total_duplicates DESC NULLS LAST,
        dm.duplicate_group NULLS LAST,
        u.id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.post("/compare", async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = ANY($1::int[])
      ORDER BY id ASC
      `,
      [ids],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.post("/merge", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // const { masterId, mergeIds } = req.body;
    const { masterId, mergeIds, masterData } = req.body;

    const ids = [masterId, ...mergeIds];

    const result = await client.query(
      `
      SELECT
    *,
    CASE
    
    WHEN email IS NOT NULL
    THEN LOWER(email)
    
    WHEN phone IS NOT NULL
    THEN phone
    
    ELSE CONCAT(
    LOWER(first_name),
    '_',
    LOWER(last_name),
    '_',
    LOWER(COALESCE(city, '')),
    '_',
    LOWER(COALESCE(state, ''))
    )
    
    END AS duplicate_group
    
    FROM users
      WHERE id = ANY($1::int[])
      ORDER BY
        updated_at DESC NULLS LAST,
        registered_date DESC NULLS LAST
      `,
      [ids],
    );

    const records = result.rows;

    if (!records.length) {
      throw new Error("No records found");
    }

    const validValues = (field) => {
      return records.filter(
        (r) => r[field] !== null && r[field] !== "" && r[field] !== undefined,
      );
    };

    const getRecentValue = (field) => {
      const valid = validValues(field);

      if (!valid.length) {
        return null;
      }

      return valid[0][field];
    };

    const getLongestValue = (field) => {
      const valid = validValues(field);

      if (!valid.length) {
        return null;
      }

      valid.sort((a, b) => {
        return String(b[field]).length - String(a[field]).length;
      });

      return valid[0][field];
    };

    const normalizePhone = (phone) => {
      if (!phone) return null;

      return String(phone).replace(/\D/g, "");
    };
    const masterRecord = records.find((r) => r.id === masterId);
    const email = masterRecord?.email || getRecentValue("email");

    let phone = null;

    const phoneCandidates = validValues("phone");

    if (phoneCandidates.length) {
      phoneCandidates.sort((a, b) => {
        return normalizePhone(b.phone).length - normalizePhone(a.phone).length;
      });

      phone = phoneCandidates[0].phone;
    }


    const first_name = masterRecord?.first_name || getRecentValue("first_name");

    const last_name = masterRecord?.last_name || getRecentValue("last_name");

    const city = getRecentValue("city");

    const state = getRecentValue("state");

    const country = getRecentValue("country");

    await client.query(
      `
      UPDATE users
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        city = $5,
        state = $6,
        country = $7,
        updated_at = NOW()
      WHERE id = $8
      `,
      [
        masterData.first_name || first_name,
        masterData.last_name || last_name,
        masterData.email || email,
        masterData.phone || phone,
        masterData.city || city,
        masterData.state || state,
        masterData.country || country,
        masterId,
      ],
    );

    await client.query(
      `
      UPDATE users
      SET
        is_merged = TRUE,
        master_customer_id = $1,
        updated_at = NOW()
      WHERE id = ANY($2::int[])
      `,
      [masterId, mergeIds],
    );
    const verify = await client.query(
      `
      SELECT id, is_merged, master_customer_id
      FROM users
      WHERE id = ANY($1::int[])
      `,
      [mergeIds],
    );

    console.log(verify.rows);

    await client.query("COMMIT");

    res.json({
      success: true,

      mergedRecord: {
        first_name,
        last_name,
        email,
        phone,
        city,
        state,
        country,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      error: error.message,
    });
  } finally {
    client.release();
  }
});

router.put("/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;

    const { first_name, last_name, email, phone, city, state, country } =
      req.body;

    await pool.query(
      `
      UPDATE users
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        city = $5,
        state = $6,
        country = $7
      WHERE uuid = $8
      `,
      [first_name, last_name, email, phone, city, state, country, uuid],
    );

    res.json({
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.delete("/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;

    await pool.query(
      `
      DELETE FROM users
      WHERE uuid = $1
      `,
      [uuid],
    );

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
