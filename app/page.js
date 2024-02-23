"use client";
import { useState } from "react";
import Papa from "papaparse";

const Home = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState("");
  const [sqlContent, setSqlContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileUpload = (event) => {
    setErrorMessage(""); // Reset error message
    const file = event.target.files[0];
    setCsvFile(file);
  };

  const handleColumnSubmit = () => {
    setErrorMessage(""); // Reset error message

    if (!csvFile) {
      setErrorMessage("Please upload a CSV file first.");
      return;
    }

    Papa.parse(csvFile, {
      complete: (result) => {
        const headers = result.data[0];

        // Filter selected columns if specified
        const filteredColumns = selectedColumns
          ? selectedColumns.split(",").map((col) => col.trim())
          : headers;

        // Check if specified columns exist in CSV
        const invalidColumns = filteredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (invalidColumns.length > 0) {
          setErrorMessage(
            `Columns not found in CSV: ${invalidColumns.join(", ")}`
          );
          return;
        }

        // Start building SQL statements
        const sqlStatements = result.data
          .slice(1) // Skip header row
          .map((row) => {
            const values = filteredColumns.map((col) => {
              const index = headers.indexOf(col);
              const value = index !== -1 ? row[index] : null;

              // Escape single quotes in values
              const escapedValue =
                value !== undefined && value !== null
                  ? value.replace(/'/g, "''")
                  : "NULL";
              return `'${escapedValue}'`;
            });

            return `INSERT INTO your_table_name (${filteredColumns.join(
              ", "
            )}) VALUES (${values.join(", ")});`;
          });

        // Combine SQL statements into a single string
        const sqlContent = sqlStatements.join("\n");

        // Update state with the SQL content
        setSqlContent(sqlContent);
      },
    });
  };

  const handleDownload = () => {
    if (errorMessage) return; // Don't download if there's an error

    const blob = new Blob([sqlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const csvFileName = csvFile.name.replace(/\.[^/.]+$/, "");
    a.href = url;
    a.download = `${csvFileName}_generated.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto my-8">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload CSV File:
        </label>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".csv"
          className="mt-1 p-2 border border-gray-300 rounded"
        />
      </div>
      {csvFile && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Selected Columns (comma-separated):
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={selectedColumns}
              onChange={(e) => setSelectedColumns(e.target.value)}
              className="mt-1 p-2 border text-black border-gray-300 rounded mr-2"
            />
            <button
              onClick={handleColumnSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Generate SQL
            </button>
          </div>
        </div>
      )}
      {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
      {sqlContent && (
        <div>
          <h2 className="text-xl font-semibold mt-4">Generated SQL:</h2>
          <textarea
            value={sqlContent}
            className="w-full h-40 mt-2 p-2 border text-black border-gray-300 rounded"
            readOnly
          />
          <button
            onClick={handleDownload}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Download SQL
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
