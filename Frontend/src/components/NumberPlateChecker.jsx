import React, { useState } from "react";
import { FaCloud, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import logo from "./logo.png";
import ClipLoader from "react-spinners/ClipLoader"; // Importing ClipLoader from react-spinners
 
const NumberPlateChecker = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // New state to track loading
 
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages(files);
  };
 
//   const handleCheck = async () => {
//     if (selectedImages.length === 0) {
//         setError("Please select an image.");
//         return;
//     }

//     const selectedImage = selectedImages[0]; // Get the first selected image
//     const formData = new FormData();
//     formData.append('image', selectedImage); // The key is 'image' as required by the API

//     try {
//         // Make the POST request with Axios
//         const response = await axios.post('http://localhost:3003/api/generate', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data', // Required for file uploads
//             },
//         });

//         const textResponse = response.data.aggregatedResponse.candidates[0].content.parts[0].text;
//         console.log('Response:', textResponse);

//         // Updated regex to match the specific response format
//         const vehicleNoMatch = textResponse.match(/\*\*\s*Vehicle number:\*\*\s*([A-Z0-9\s]+)/i);
//         const smallNoMatch = textResponse.match(/\*\*\s*Small number:\*\*\s*([A-Z0-9]+)/i);

//         // Check if the response starts with "Yes" for hologram presence
//         const hologramMatch = textResponse.includes("Yes, there is a hologram");

//         // Extract the registration number, small number, and hologram presence
//         const registrationno = vehicleNoMatch ? vehicleNoMatch[1].trim() : null;
//         const lid_no = smallNoMatch ? smallNoMatch[1].trim() : null;
//         const hologram = hologramMatch ? 'Yes' : 'No'; // "Yes" if the line starts with "Yes", otherwise "No"

//         // Auto-generate serial number
//         const serialno = Math.floor(Math.random() * 1000000); // Generate a random serial number

//         // Create the JSON object
//         const jsonArray = [
//             {
//                 serialno: serialno,
//                 lid_no: lid_no,
//                 registrationno: registrationno,
//                 hologram: hologram
//             }
//         ];

//         // Log the generated JSON array
//         console.log('Generated JSON Array:', jsonArray);
//         setTableData(jsonArray);
//     } catch (error) {
//         // Handle error
//         console.error('Error uploading image:', error);
//         setError("Failed to upload image. Please try again.");
//     }
// };

const handleCheck = async () => {
  if (selectedImages.length === 0) {
      setError("Please select an image.");
      return;
  }

  setLoading(true); // Set loading to true while processing
  const jsonArray = []; // Initialize an empty array to store results

  for (let i = 0; i < selectedImages.length; i++) {
      const selectedImage = selectedImages[i]; // Get the current image
      const formData = new FormData();
      formData.append('image', selectedImage); // The key is 'image' as required by the API

      try {
          // Make the POST request with Axios
          const response = await axios.post('http://localhost:3003/api/generate', formData, {
              headers: {
                  'Content-Type': 'multipart/form-data', // Required for file uploads
              },
          });

          const textResponse = response.data.aggregatedResponse.candidates[0].content.parts[0].text;
          console.log('Response:', textResponse);

          // Updated regex to match the specific response format
          const vehicleNoMatch = textResponse.match(/\*\*\s*Vehicle number:\*\*\s*([A-Z0-9\s]+)/i);
          const smallNoMatch = textResponse.match(/\*\*\s*Small number:\*\*\s*([A-Z0-9]+(?:\/[A-Z0-9]+)?)/i);
         // const smallNoMatch = textResponse.match(/\*\*\s*Small number:\*\*\s*([A-Z0-9]+)(?:\/([A-Z0-9]+))?/i);


          // Check if the response indicates hologram presence
          const hologramMatch = textResponse.includes("Yes, there is a hologram");

          // Extract the registration number, small number, and hologram presence
          const registrationno = vehicleNoMatch ? vehicleNoMatch[1].trim() : null;
          const lid_no = smallNoMatch ? smallNoMatch[1].trim() : null;
          const hologram = hologramMatch ? 'Yes' : 'No'; // "Yes" if the line starts with "Yes", otherwise "No"

          // Auto-generate serial number
          const serialno = Math.floor(Math.random() * 1000000); // Generate a random serial number

          // Create the JSON object for the current image
          jsonArray.push({
              serialno: serialno,
              lid_no: lid_no,
              registrationno: registrationno,
              hologram: hologram
          });

      } catch (error) {
          console.error('Error uploading image:', error);
          setError("Failed to upload image. Please try again.");
      }
  }

  setLoading(false); // Set loading to false after processing all images
  setTableData(jsonArray); // Set the table data with all results
  console.log('Generated JSON Array:', jsonArray); // Log the accumulated JSON array
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
<table className="w-full">
<thead className="bg-gradient-to-r from-blue-600 to-red-600 text-white">
<tr>
<th className="py-3 px-6 text-left">Serial No.</th>
<th className="py-3 px-6 text-left">LID Number</th>
<th className="py-3 px-6 text-left">Registration No.</th>
<th className="py-3 px-6 text-left">Hologram</th>
<th className="py-3 px-6 text-left">Action</th>
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

<button className="text-red-500 hover:underline ml-4">OK</button>
</td>
</tr>
                ))
              ) : (
<tr>
<td
                    colSpan="5"
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

