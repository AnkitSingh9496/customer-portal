import { useState } from "react";
import Table from "./Table.jsx";
import EditUserModal from "./EditUserModal.jsx";
import CompareModal from "./CompareModal.jsx";
import useUsers from "../hooks/useUsers.jsx";
import { userColumns } from "../config/tableColumns.jsx";
import {
  updateUser,
  deleteUser,
  compareUsers,
  mergeUsers,
} from "../api/api.jsx";

function UserTable() {
  const { users, loading, error, reloadUsers } = useUsers();

  const [selectedUser, setSelectedUser] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);

  const [compareData, setCompareData] = useState([]);

  const [successMessage, setSuccessMessage] = useState("");

  const handleDelete = async (uuid) => {
    try {
      await deleteUser(uuid);

      reloadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);

    setIsModalOpen(true);
  };

  const handleSave = async (updatedData) => {
    try {
      await updateUser(selectedUser.uuid, updatedData);

      setIsModalOpen(false);

      setSelectedUser(null);

      reloadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompare = async () => {
    if (!selectedRows.length) {
      return;
    }

    try {
      const data = await compareUsers(selectedRows);

      if (!data.length) {
        return;
      }

      const uniqueGroups = [...new Set(data.map((x) => x.duplicate_group))];

      if (uniqueGroups.length > 1) {
        alert("Please select records from same duplicate group only");

        return;
      }

      setCompareData(data);
    } catch (error) {
      console.error(error);
    }
  };


  const handleMerge = async (editedRecords = compareData) => {
    if (editedRecords.length < 2) {
      alert("Please compare at least 2 duplicate records");

      return;
    }

    try {
      const masterId = editedRecords[0].id;

      const mergeIds = editedRecords.slice(1).map((x) => x.id);

      await mergeUsers(masterId, mergeIds, editedRecords[0]);

      setCompareData([]);

      setSelectedRows([]);

      reloadUsers();

      setSuccessMessage("Records merged successfully");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#22c55e",
            color: "white",
            padding: "12px 18px",
            borderRadius: "8px",
            zIndex: 9999,
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {successMessage}
        </div>
      )}
      <div className="top-actions">
        <button
          className="compare-btn"
          onClick={handleCompare}
          disabled={selectedRows.length === 0}
        >
          Compare
        </button>

        <span>Selected: {selectedRows.length}</span>
      </div>

      <Table
        columns={userColumns}
        data={users}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onCompare={handleCompare}
      />

      <EditUserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);

          setSelectedUser(null);
        }}
        onSave={handleSave}
      />

      <CompareModal
        data={compareData}
        onClose={() => setCompareData([])}
        onMerge={handleMerge}
      />
    </>
  );
}

export default UserTable;
