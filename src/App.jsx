// App.jsx
import React, { useEffect, useRef, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState('');
  const [wic, setWic] = useState('');
  const [source, setSource] = useState('');
  const [store, setStore] = useState('');
  const [finalInfo, setFinalInfo] = useState('');
  const [infoGenerated, setInfoGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const preRef = useRef(null);

  useEffect(() => {
    fetch('resolution.json')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  const handleDropdownChange = (e) => {
    setSelected(e.target.value);
    setFinalInfo('');
    setInfoGenerated(false);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 0) {
      const matches = data.filter((item) =>
        item["Incident Reported (In Remedy)"]?.toLowerCase().includes(term.toLowerCase())
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (text) => {
    setSearchTerm(text);
    setSuggestions([]);
  };

  const handleGenerate = () => {
    const selectedItem = data.find(
      (item) => item["PROBLEM REPORTED in Resolution Comment"] === selected
    );
    if (!selectedItem) return;

    const formatted = `
Problem Reported: ${selectedItem["PROBLEM REPORTED in Resolution Comment"]}
Solution: ${selectedItem["SOLUTION in Resolution Comment(One liner summary)"]}
KBA Referred: ${selectedItem["KBA#"]}
Incident Specific Details:
WIC: ${wic}
Source: ${source}
Store: ${store}
Resolution Steps:
${selectedItem["Resolution Steps(Detailed steps followed to resolve the incident)"]}
Resolution Categorization: Service Request | User Awareness
Any Third Party/ Other Teams Involved: No
Name of Third Party/ Other Teams: ${selectedItem["Vendor Name"] || "N/A"}
    `.trim();

    setFinalInfo(formatted);
    setInfoGenerated(true);

    setTimeout(() => {
      if (preRef.current) {
        preRef.current.innerText = formatted;
      }
    }, 0);

    alert('This content is editable. You can make changes directly.');
  };

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText;
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const handleInject = async () => {
    const text = preRef.current?.innerText;
    if (!text) return alert('Nothing to inject.');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes("https://walgreens.onbmc.com")) {
      alert("Please navigate to the Walgreens Remedy page first.");
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (info) => {
        const textarea = document.getElementById("arid_WIN_4_1000000156");
        if (textarea) {
          textarea.value = info;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          alert("Textarea with ID 'arid_WIN_4_1000000156' not found.");
        }
      },
      args: [text]
    });
  };

  return (
    <div className="container p-3" style={{ width: 330 }}>
      <h5 className="text-center mb-3">Resolution Formatter</h5>

      <select className="form-select mb-3" onChange={handleDropdownChange} value={selected}>
        <option value="">Select a Problem</option>
        {data.map((item, idx) => (
          <option key={idx} value={item["PROBLEM REPORTED in Resolution Comment"]}>
            {item["PROBLEM REPORTED in Resolution Comment"]}
          </option>
        ))}
      </select>

      <div className="mb-3 position-relative">
        <input
          type="text"
          className="form-control"
          placeholder="Search Incident Reported (In Remedy)"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {suggestions.length > 0 && (
          <ul className="list-group position-absolute w-100 shadow mt-1" style={{ zIndex: 10 }}>
            {suggestions.map((item, index) => (
              <li
                key={index}
                className="list-group-item list-group-item-action"
                onClick={() => handleSuggestionClick(item["Incident Reported (In Remedy)"])}
                style={{ cursor: 'pointer', animation: 'fadeIn 0.2s ease-in' }}
              >
                {item["Incident Reported (In Remedy)"]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && !infoGenerated && (
        <>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Enter WIC"
            value={wic}
            onChange={(e) => setWic(e.target.value)}
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Enter Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Enter Store"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          />
          <button className="btn btn-primary w-100 mb-3" onClick={handleGenerate}>
            Generate Info
          </button>
        </>
      )}

      {infoGenerated && (
        <>
          <pre
            ref={preRef}
            contentEditable={true}
            className="alert alert-light small text-start border"
            suppressContentEditableWarning={true}
            style={{ whiteSpace: 'pre-wrap', outline: 'none', minHeight: '200px' }}
          />
          <button className="btn btn-success w-100 btn-sm mb-2" onClick={handleCopy}>
            Copy to Clipboard
          </button>
          <button className="btn btn-warning w-100 btn-sm" onClick={handleInject}>
            Inject to Walgreens Remedy
          </button>
        </>
      )}
    </div>
  );
}

export default App;

// // App.jsx
// import React, { useEffect, useRef, useState } from 'react';

// function App() {
//   const [data, setData] = useState([]);
//   const [selected, setSelected] = useState('');
//   const [wic, setWic] = useState('');
//   const [source, setSource] = useState('');
//   const [store, setStore] = useState('');
//   const [finalInfo, setFinalInfo] = useState('');
//   const [infoGenerated, setInfoGenerated] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [suggestions, setSuggestions] = useState([]);
//   const preRef = useRef(null);

//   useEffect(() => {
//     fetch('resolution.json')
//       .then((res) => res.json())
//       .then((json) => setData(json));
//   }, []);

//   const handleDropdownChange = (e) => {
//     setSelected(e.target.value);
//     setFinalInfo('');
//     setInfoGenerated(false);
//   };

//   const handleSearchChange = (e) => {
//     const term = e.target.value;
//     setSearchTerm(term);
//     if (term.length > 0) {
//       const matches = data.filter((item) =>
//         item["Incident Reported (In Remedy)"]?.toLowerCase().includes(term.toLowerCase())
//       );
//       setSuggestions(matches);
//     } else {
//       setSuggestions([]);
//     }
//   };

//   const handleSuggestionClick = (text) => {
//     setSearchTerm(text);
//     setSuggestions([]);
//   };

//   const handleGenerate = () => {
//     const selectedItem = data.find(
//       (item) => item["PROBLEM REPORTED in Resolution Comment"] === selected
//     );
//     if (!selectedItem) return;

//     const formatted = `
// Problem Reported: ${selectedItem["PROBLEM REPORTED in Resolution Comment"]}
// Solution: ${selectedItem["SOLUTION in Resolution Comment(One liner summary)"]}
// KBA Referred: ${selectedItem["KBA#"]}
// Incident Specific Details:
// WIC: ${wic}
// Source: ${source}
// Store: ${store}
// Resolution Steps:
// ${selectedItem["Resolution Steps(Detailed steps followed to resolve the incident)"]}
// Resolution Categorization: Service Request | User Awareness
// Any Third Party/ Other Teams Involved: No
// Name of Third Party/ Other Teams: ${selectedItem["Vendor Name"] || "N/A"}
//     `.trim();

//     setFinalInfo(formatted);
//     setInfoGenerated(true);

//     setTimeout(() => {
//       if (preRef.current) {
//         preRef.current.innerText = formatted;
//       }
//     }, 0);

//     alert('This content is editable. You can make changes directly.');
//   };

//   const handleCopy = () => {
//     if (preRef.current) {
//       const text = preRef.current.innerText;
//       navigator.clipboard.writeText(text);
//       alert('Copied to clipboard!');
//     }
//   };

//   return (
//     <div className="container p-3" style={{ width: 330 }}>
//       <h5 className="text-center mb-3">Resolution Formatter</h5>

//       <select className="form-select mb-3" onChange={handleDropdownChange} value={selected}>
//         <option value="">Select a Problem</option>
//         {data.map((item, idx) => (
//           <option key={idx} value={item["PROBLEM REPORTED in Resolution Comment"]}>
//             {item["PROBLEM REPORTED in Resolution Comment"]}
//           </option>
//         ))}
//       </select>

//       <div className="mb-3 position-relative">
//         <input
//           type="text"
//           className="form-control"
//           placeholder="Search Incident Reported (In Remedy)"
//           value={searchTerm}
//           onChange={handleSearchChange}
//         />
//         {suggestions.length > 0 && (
//           <ul className="list-group position-absolute w-100 shadow mt-1" style={{ zIndex: 10 }}>
//             {suggestions.map((item, index) => (
//               <li
//                 key={index}
//                 className="list-group-item list-group-item-action"
//                 onClick={() => handleSuggestionClick(item["Incident Reported (In Remedy)"])}
//                 style={{ cursor: 'pointer', animation: 'fadeIn 0.2s ease-in' }}
//               >
//                 {item["Incident Reported (In Remedy)"]}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {selected && !infoGenerated && (
//         <>
//           <input
//             type="text"
//             className="form-control mb-2"
//             placeholder="Enter WIC"
//             value={wic}
//             onChange={(e) => setWic(e.target.value)}
//           />
//           <input
//             type="text"
//             className="form-control mb-2"
//             placeholder="Enter Source"
//             value={source}
//             onChange={(e) => setSource(e.target.value)}
//           />
//           <input
//             type="text"
//             className="form-control mb-3"
//             placeholder="Enter Store"
//             value={store}
//             onChange={(e) => setStore(e.target.value)}
//           />
//           <button className="btn btn-primary w-100 mb-3" onClick={handleGenerate}>
//             Generate Info
//           </button>
//         </>
//       )}

//       {infoGenerated && (
//         <>
//           <pre
//             ref={preRef}
//             contentEditable={true}
//             className="alert alert-light small text-start border"
//             suppressContentEditableWarning={true}
//             style={{ whiteSpace: 'pre-wrap', outline: 'none', minHeight: '200px' }}
//           />
//           <button className="btn btn-success w-100 btn-sm" onClick={handleCopy}>
//             Copy to Clipboard
//           </button>
//         </>
//       )}
//     </div>
//   );
// }

// export default App;