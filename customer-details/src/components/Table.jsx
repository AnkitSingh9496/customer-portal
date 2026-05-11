import { useEffect, useRef } from "react";
import $ from "jquery";
import "datatables.net-bs5";
import { getStatus } from "../utils/helper.jsx";

function Table({
  selectedRows,
  setSelectedRows,
  columns,
  data,
  loading,
  error,
  onEdit,
  onDelete,
  emptyMessage = "No data found",
}) {
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const userByUuid = useRef(new Map());

  useEffect(() => {
    userByUuid.current = new Map((data || []).map((u) => [u.uuid, u]));
  }, [data]);

  useEffect(() => {
    const tableElement = tableRef.current;
    if (!tableElement) return;

    if ($.fn.DataTable.isDataTable(tableElement)) {
      $(tableElement).DataTable().destroy();
    }

    dataTableRef.current = $(tableElement).DataTable({
      paging: true,
      searching: true,
      ordering: true,
      info: true,
      responsive: true,
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50, 100],
      columns: columns.map(() => ({ defaultContent: "" })),
      language: {
        emptyTable: emptyMessage,
      },
    });

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy(true);
        dataTableRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!dataTableRef.current) return;

    const table = dataTableRef.current;
    table.clear();

    if (!loading && !error && data.length) {
      const rows = data.map((user) => {
        const status = user.status ?? getStatus(user.registered_date);
        return [
          `<input
            type="checkbox"
            class="row-checkbox"
            data-id="${user.id}"
            ${selectedRows.includes(user.id) ? "checked" : ""}
          />`,

          user.uuid?.slice(0, 8),

          `${user.first_name} ${user.last_name}`,

          user.email,

          user.phone || "-",

          user.city || "-",

          user.state || "-",

          user.country,

          user.api_seed ? user.api_seed.slice(0, 8) : "-",

          user.total_duplicates
            ? `<span class="duplicate-badge">
                ${user.total_duplicates} duplicates
              </span>`
            : "-",

          `<span class="status ${
            status === "Active" ? "active" : "inactive"
          }">${status}</span>`,

          new Date(user.registered_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),

          `<div class="actions">
            <button
              class="edit-btn"
              data-action="edit"
              data-uuid="${user.uuid}"
            >
              Edit
            </button>
        
            <button
              class="delete-btn"
              data-action="delete"
              data-uuid="${user.uuid}"
            >
              Delete
            </button>
          </div>`,
        ];
      });

      table.rows.add(rows);
    }

    table.draw(false);

    const tableElement = tableRef.current;
    $(tableElement).off("click", "button");
    $(tableElement).on("click", "button", function () {
      const action = $(this).data("action");
      const uuid = $(this).data("uuid");
      const user = userByUuid.current.get(uuid);
      if (!user) return;
      if (action === "edit") onEdit(user);
      if (action === "delete") onDelete(uuid);
    });
    $(tableElement).on("change", ".row-checkbox", function () {
      const id = Number($(this).data("id"));

      if ($(this).is(":checked")) {
        setSelectedRows((prev) => {
          if (prev.includes(id)) {
            return prev;
          }

          return [...prev, id];
        });
      } else {
        setSelectedRows((prev) => {
          return prev.filter((x) => Number(x) !== Number(id));
        });
      }
    });

    return () => {
      $(tableElement).off("click", "button");
    };
  }, [loading, error, columns]);

  return (
    <>
      {loading && <div className="message">Loading...</div>}
      {error && <div className="message error">{error}</div>}

      <div
        className="table-container"
        style={{ display: loading || error ? "none" : "block" }}
      >
        <table
          ref={tableRef}
          className="user-table table table-striped"
          style={{ width: "100%" }}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    </>
  );
}

export default Table;
