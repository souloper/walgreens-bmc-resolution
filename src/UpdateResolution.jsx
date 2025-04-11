// UpdateResolution.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import logo from "./assets/Walgreens.png"
import "./App.css"
import toast, { Toaster } from 'react-hot-toast';

const UpdateResolution = () => {
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      // Trigger download of JSON as resolution.json
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'resolution.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Downloaded Successfully!')
      setMessage(`✅ resolution.json downloaded successfully.\nPlease place it in the public folder manually.`);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
    <Toaster/>
    <div className="container p-3" style={{ width: 330 }}>   
      <h5 className="text-center mb-3">Resolution Formatter</h5>
            <img src={logo} alt="w-logo" className='w-l' />
      <input type="file" accept=".xlsx" onChange={handleUpload} className="form-control mb-3" />
      {message && <div className="alert alert-success">{message}</div>}
      <div className="text-center mt-3">
        <Link to="/">/back</Link><br></br>
        <Link to="/update-resolution/json-steps">JSON replacement?</Link>
      </div>
    </div>
    <div className='footer text-center fst-italic'>Developed with/for Walgreens by <a href="https://github.com/souloper" target="_blank">Soumya Das</a></div>
    </>
  );
};

export default UpdateResolution;
