import React, { useState, useEffect } from "react";
import { FaCloud, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import logo from "./logo.png";
import ClipLoader from "react-spinners/ClipLoader"; // Importing ClipLoader from react-spinners
import { geminiApi } from "../path/constant";
import * as XLSX from "xlsx"; // Importing XLSX library

const NumberPlateChecker = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [tableData, setTableData] = useState([]); // State for storing table data
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState({}); // State to track checkbox approvals
  const [isPrintEnabled, setIsPrintEnabled] = useState(false); // Track if print button should be enabled
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false); // Track "Select All" checkbox state

  // Update the print button state based on approvals
  useEffect(() => {
    const hasCheckedApproval = Object.values(approvals).some(Boolean);
    setIsPrintEnabled(hasCheckedApproval);
  }, [approvals]);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages(files);
  };

  // const handleCheck = async () => {
  //   if (selectedImages.length === 0) {
  //     setError("Please select an image.");
  //     return;
  //   }

  //   setLoading(true); // Set loading to true while processing
  //   const jsonArray = []; // Initialize an empty array to store results

  //   for (let i = 0; i < selectedImages.length; i++) {
  //     const selectedImage = selectedImages[i]; // Get the current image
  //     const formData = new FormData();
  //     formData.append("image", selectedImage); // The key is 'image' as required by the API

  //     try {
  //       // Make the POST request with Axios
  //       const response = await axios.post(geminiApi, formData, {
  //         headers: {
  //           "Content-Type": "multipart/form-data", // Required for file uploads
  //         },
  //       });

  //       const textResponse =
  //         response.data.aggregatedResponse.candidates[0].content.parts[0]
  //           .text;
  //       console.log("Response:", textResponse);

  //       // Extract Vehicle Number
  //       const vehicleNoMatch = textResponse.match(
  //         /\*\*\s*Vehicle number:\*\*\s*([A-Z0-9\s]+)/i
  //       );

  //       // Extract Small Number and ensure it's 12 digits long, removing spaces and special characters
  //       const smallNoMatch = textResponse.match(
  //         /\*\*\s*Small number:\*\*\s*([A-Z0-9]+(?:\/[A-Z0-9]+)?)/i
  //       );
  //       let lid_no = smallNoMatch
  //         ? smallNoMatch[1].replace(/[^\w]/g, "").substring(0, 12)
  //         : null;

  //       // Check for Hologram
  //       const hologramMatch = textResponse.includes("Yes, there is a hologram");

  //       // Extract the registration number and hologram presence
  //       const registrationno = vehicleNoMatch
  //         ? vehicleNoMatch[1].trim()
  //         : null;
  //       const hologram = hologramMatch ? "Yes" : "No";

  //       // Auto-generate serial number
  //       const serialno = tableData.length + i + 1; // Use current length + index + 1

  //       // Create the JSON object for the current image
  //       jsonArray.push({
  //         serialno: serialno,
  //         lid_no: lid_no,
  //         registrationno: registrationno,
  //         hologram: hologram,
  //       });
  //     } catch (error) {
  //       console.error("Error uploading image:", error);
  //       setError("Failed to upload image. Please try again.");
  //     }
  //   }

  //   setLoading(false); // Set loading to false after processing all images

  //   // Append new data to existing table data
  //   setTableData((prevTableData) => [...prevTableData, ...jsonArray]); // Append new data to the previous table data
  //   console.log("Updated JSON Array:", [...tableData, ...jsonArray]); // Log the updated array
  // };


  const handleCheck = async () => {
    if (selectedImages.length === 0) {
      setError("Please select an image.");
      return;
    }
  
    setLoading(true); // Set loading to true while processing
    const jsonArray = []; // Initialize an empty array to store results
  
    // Utility function to handle retries with exponential backoff
    const retryWithBackoff = async (fn, retries = 5, delay = 10000, maxDelay = 16000) => {
      try {
        return await fn(); // Try the API call
      } catch (error) {
        if (retries === 0) {
          throw error; // If no retries are left, throw the error
        }
        const newDelay = Math.min(maxDelay, delay * 2); // Exponential backoff with cap
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for the delay
        return retryWithBackoff(fn, retries - 1, newDelay, maxDelay); // Retry with increased delay
      }
    };
  
    for (let i = 0; i < selectedImages.length; i++) {
      const selectedImage = selectedImages[i]; // Get the current image
      const formData = new FormData();
      formData.append("image", selectedImage); // The key is 'image' as required by the API
  
      try {
        // Wrap the API call with retry logic
        const response = await retryWithBackoff(() =>
          axios.post(geminiApi, formData, {
            headers: {
              "Content-Type": "multipart/form-data", // Required for file uploads
            },
          })
        );
  
        const textResponse =
          response.data.aggregatedResponse.candidates[0].content.parts[0]
            .text;
        console.log("Response:", textResponse);
  
        // Extract Vehicle Number
        const vehicleNoMatch = textResponse.match(
          /\*\*\s*Vehicle number:\*\*\s*([A-Z0-9\s]+)/i
        );
  
        // Extract Small Number and ensure it's 12 digits long, removing spaces and special characters
        
        const smallNoMatch = textResponse.match(
          /\*\*\s*Small number:\*\*\s*([A-Z0-9]+(?:\/[A-Z0-9]+)?)/i
        );
        let lid_no = smallNoMatch
          ? smallNoMatch[1].replace(/[^\w]/g, "").substring(0, 12)
          : null;
  
        // Check for Hologram
        const hologramMatch = textResponse.includes("Yes, there is a hologram");
  
        // Extract the registration number and hologram presence
        const registrationno = vehicleNoMatch
          ? vehicleNoMatch[1].trim()
          : null;
        const hologram = hologramMatch ? "Yes" : "No";
  
        // Auto-generate serial number
        const serialno = tableData.length + i + 1; // Use current length + index + 1
  
        // Create the JSON object for the current image
        jsonArray.push({
          serialno: serialno,
          lid_no: lid_no,
          registrationno: registrationno,
          hologram: hologram,
        });
      } catch (error) {
        console.error("Error uploading image after retries:", error);
        setError("Failed to upload image after retries. Please try again later.");
      }
    }
  
    setLoading(false); // Set loading to false after processing all images
  
    // Append new data to existing table data
    setTableData((prevTableData) => [...prevTableData, ...jsonArray]); // Append new data to the previous table data
    console.log("Updated JSON Array:", [...tableData, ...jsonArray]); // Log the updated array
  };
  

  const handleApprovalChange = (index) => {
    // Toggle the approval state for the given index
    setApprovals((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSelectAll = () => {
    // Toggle select all checkboxes
    const newApprovals = {};
    tableData.forEach((_, index) => {
      newApprovals[index] = !isSelectAllChecked; // Set approval to opposite of current "Select All" state
    });
    setApprovals(newApprovals);
    setIsSelectAllChecked(!isSelectAllChecked); // Update "Select All" state
  };

  const handleExportToExcel = () => {
    // Filter the approved rows
    const approvedData = tableData.filter((_, index) => approvals[index]);

    // Convert the approved data into a sheet
    const worksheet = XLSX.utils.json_to_sheet(approvedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approved Data");

    // Export the sheet as an Excel file
    XLSX.writeFile(workbook, "approved_data.xlsx");
  };
  const handleExportToJson = () => {
   
     const approvedData = tableData.filter((_, index) => approvals[index]);

     // Create a blob of the JSON data
     const jsonBlob = new Blob([JSON.stringify(approvedData, null, 2)], {
       type: "application/json",
     });
 
     // Create a link element to trigger the download
     const url = URL.createObjectURL(jsonBlob);
     const a = document.createElement("a");
     a.href = url;
     a.download = "approved_data.json"; // Filename for the JSON file
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url); // Clean up the URL object
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-red-100">
      <nav className="bg-gradient-to-r from-blue-600 to-red-600 p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
          <h1 className="text-2xl font-bold text-white">Number Plate Checker</h1>
        </div>
      </nav>

      <main className="container mx-auto mt-8 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">
            Number Plate Image
          </h2>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="imageInput"
              accept="image/*"
            />
            <label
              htmlFor="imageInput"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <FaCloud className="text-5xl text-blue-500 mb-4" />
              <span className="text-lg font-medium text-blue-700">
                Click to upload or drag and drop
              </span>
              <span className="text-sm text-gray-500 mt-2">
                Supports multiple images
              </span>
            </label>
          </div>
          {selectedImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {selectedImages.map((image, index) => (
                <div
                  key={index}
                  className="relative group overflow-hidden rounded-lg shadow-md"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Selected ${index + 1}`}
                    className="w-24 h-24 object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {image.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleCheck}
            className="mt-6 bg-gradient-to-r from-blue-500 to-red-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Check
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center mt-6">
            <ClipLoader color="#3498db" size={50} />
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-r-lg shadow-md flex items-center">
            <FaExclamationTriangle className="text-2xl mr-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Print Button (conditionally enabled) */}
          <div className="flex justify-end pr-6 pt-4">
            <button
              onClick={handleExportToExcel}
              disabled={!isPrintEnabled} // Disable button if no approvals
              className={`${
                isPrintEnabled
                  ? "bg-gradient-to-r from-blue-500 to-red-500 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none mr-3`}
            >
             Download as excel
            </button>
            <button onClick={handleExportToJson}
              disabled={!isPrintEnabled} // Disable button if no approvals
              className={`${
                isPrintEnabled
                  ? "bg-gradient-to-r from-blue-500 to-red-500 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none`}>
             Downlaod as json
            </button>
            
          </div>

          

          {/* Adding space between button and table */}
          <div className="mt-6"></div>

          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-red-600 text-white">
              <tr>
                <th className="py-3 px-6 text-left">Serial No.</th>
                <th className="py-3 px-6 text-left">LID Number</th>
                <th className="py-3 px-6 text-left">Registration No.</th>
                <th className="py-3 px-6 text-left">Hologram</th>
                <th className="py-3 px-6 text-left">Approval</th>
                <th className="py-3 px-6 text-left">
                  <input
                    type="checkbox"
                    checked={isSelectAllChecked}
                    onChange={handleSelectAll}
                    className="form-checkbox text-blue-600 h-5 w-5"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-4 px-6 border-b border-gray-200">
                      {item.serialno}
                    </td>
                    <td className="py-4 px-6 border-b border-gray-200">
                      {item.lid_no}
                    </td>
                    <td className="py-4 px-6 border-b border-gray-200">
                      {item.registrationno}
                    </td>
                    <td className="py-4 px-6 border-b border-gray-200">
                      {item.hologram}
                    </td>
                    <td className="py-4 px-6 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={approvals[index] || false}
                        onChange={() => handleApprovalChange(index)}
                        className="form-checkbox text-blue-600 h-5 w-5"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6" // Updated to match total columns including "Select All"
                    className="py-4 px-6 text-center text-gray-500 italic"
                  >
                    No data to show
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default NumberPlateChecker;
