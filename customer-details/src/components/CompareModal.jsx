import { useEffect, useMemo, useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

function CompareModal({ data, onClose, onMerge }) {
  const [editableData, setEditableData] = useState([]);

  useEffect(() => {
    setEditableData(data || []);
  }, [data]);

  const editableFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "city",
    "state",
    "country",
  ];

  const fields = useMemo(() => {
    if (!editableData.length) {
      return [];
    }

    return Object.keys(editableData[0]).filter(
      (key) =>
        ![
          "id",
          "registered_date",
          "updated_at",
          "is_merged",
          "master_customer_id",
          "duplicate_group",
          "total_duplicates",
          "api_seed",
        ].includes(key),
    );
  }, [editableData]);

  const handleCellEdit = (rowIndex, field, value) => {
    setEditableData((prev) => {
      const updated = [...prev];

      updated[rowIndex] = {
        ...updated[rowIndex],
        [field]: value,
      };

      return updated;
    });
  };

  const handleMergeClick = async () => {
    try {
      await onMerge(editableData);
    } catch (error) {
      console.error(error);
    }
  };

  if (!editableData.length) {
    return null;
  }

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.65)",
        zIndex: 1050,
      }}
    >
      <div className="modal-dialog modal-fullscreen">
        <div
          className="modal-content"
          style={{
            background: "#1f2937",
            color: "#fff",
            borderRadius: "0",
            border: "none",
          }}
        >
          <div className="modal-header border-secondary">
            <h2 className="modal-title">Compare Duplicate Users</h2>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          <div className="modal-body">
            <div className="table-responsive">
              <table
                className="table table-dark table-hover align-middle"
                style={{
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        minWidth: "80px",
                      }}
                    >
                      #
                    </th>

                    {fields.map((field) => (
                      <th
                        key={field}
                        style={{
                          minWidth: "180px",
                          textTransform: "capitalize",
                        }}
                      >
                        {field.replaceAll("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {editableData.map((user, rowIndex) => (
                    <tr key={user.id}>
                      <td>
                        <div
                          className="fw-bold"
                          style={{
                            color: rowIndex === 0 ? "#22c55e" : "#fff",
                          }}
                        >
                          {rowIndex === 0 ? "MASTER" : `USER ${rowIndex + 1}`}
                        </div>
                      </td>

                      {fields.map((field) => (
                        <td
                          key={`${user.id}-${field}`}
                          contentEditable={editableFields.includes(field)}
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            handleCellEdit(rowIndex, field, e.target.innerText)
                          }
                          style={{
                            background: editableFields.includes(field)
                              ? "#111827"
                              : "transparent",

                            border: "1px solid #374151",

                            color: "#fff",

                            cursor: editableFields.includes(field)
                              ? "text"
                              : "default",

                            minWidth: "180px",
                          }}
                        >
                          {user[field] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="alert alert-warning mt-4">
              <strong>Merge Logic:</strong>
              <ul className="mb-0 mt-2">
                <li>First row becomes MASTER record</li>

                <li>Edit any cell inline before merging</li>

                <li>Latest edited values will be saved</li>

                <li>Other selected records will be marked merged</li>
              </ul>
            </div>
          </div>

          <div className="modal-footer border-secondary">
            <button className="btn btn-success px-4" onClick={handleMergeClick}>
              Merge Records
            </button>

            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompareModal;
