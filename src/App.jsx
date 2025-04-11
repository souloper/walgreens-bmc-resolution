// App.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import logo from "./assets/Walgreens.png";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState("");
  const [wic, setWic] = useState("");
  const [source, setSource] = useState("");
  const [store, setStore] = useState("");
  const [finalInfo, setFinalInfo] = useState("");
  const [infoGenerated, setInfoGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const preRef = useRef(null);

  // useEffect(() => {
  //   fetch('resolution.json')
  //     .then((res) => res.json())
  //     .then((json) => setData(json));
  // }, []);
  useEffect(() => {
    fetch("resolution.json")
      .then((res) => res.json())
      .then((json) => {
        const enrichedData = json.map((item) => ({
          ...item,
          displayLabel: item["Incident Reported (In Remedy)"]?.includes("UNIX")
            ? item["Incident Reported (In Remedy)"]
            : item["PROBLEM REPORTED in Resolution Comment"],
        }));
        setData(enrichedData);
      })
      .catch((err) => {
        console.error("Error loading JSON:", err);
      });
  }, []);

  useEffect(() => {
    chrome.tabs &&
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.url.includes("https://walgreens.onbmc.com")) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                const el = document.getElementById("arid_WIN_4_303530000");
                return el ? el.value : "";
              },
            },
            (results) => {
              if (results && results[0]) {
                setStore(results[0].result.substring(0, 5));
              }
            }
          );
        }
      });
  }, []);

  const handleDropdownChange = (e) => {
    setSelected(e.target.value);
    setFinalInfo("");
    setInfoGenerated(false);
  };
  
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  
    if (term.length > 0) {
      const matches = data.filter((item) =>
        item.displayLabel?.toLowerCase().includes(term.toLowerCase())
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };
  
  // const handleSearchChange = (e) => {
  //   const term = e.target.value;
  //   setSearchTerm(term);
  //   if (term.length > 0) {
  //     const matches = data.filter((item) =>
  //       item["Incident Reported (In Remedy)"]
  //         ?.toLowerCase()
  //         .includes(term.toLowerCase())
  //     );
  //     setSuggestions(matches);
  //   } else {
  //     setSuggestions([]);
  //   }
  // };

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
${
  selectedItem[
    "Resolution Steps(Detailed steps followed to resolve the incident)"
  ]
}
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

    // alert('This content is editable. You can make changes directly.');
    toast((t) => (
      <span>
        This content is <b>editable</b>. You can make changes directly.{" "}
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => toast.dismiss(t.id)}
        >
          Dismiss
        </button>
      </span>
    ));
  };

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText;
      navigator.clipboard.writeText(text);
      // alert('Copied to clipboard!');
      toast.success("Copied to clipboard!");
    }
  };

  const handleInject = async () => {
    const text = preRef.current?.innerText;
    if (!text) return alert("Nothing to inject.");

    toast.success("Data Pushed!");
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
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
      args: [text],
    });
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="container p-3" style={{ width: 330 }}>
        <h5 className="text-center mb-3">Resolution Formatter</h5>
        <img src={logo} alt="w-logo" className="w-l" />

        <select
          className="form-select mb-3"
          onChange={handleDropdownChange}
          value={selected}
        >
          <option value="">Select a Problem</option>
          {data.map((item, idx) => (
            <option
              key={idx}
              value={item["PROBLEM REPORTED in Resolution Comment"]}
            >
              {item.displayLabel}
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
            <ul
              className="list-group position-absolute w-100 shadow mt-1"
              style={{ zIndex: 10 }}
            >
              {suggestions.map((item, index) => (
                <li
                  key={index}
                  className="list-group-item list-group-item-action"
                  onClick={() =>
                    handleSuggestionClick(item["Incident Reported (In Remedy)"])
                  }
                  style={{
                    cursor: "pointer",
                    animation: "fadeIn 0.2s ease-in",
                  }}
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
              className="form-control mb-3 text-danger border-danger-subtle"
              placeholder="Enter Store"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              color=""
            />
            <button
              className="btn btn-primary w-100 mb-3"
              onClick={handleGenerate}
            >
              Generate Info
            </button>
          </>
        )}

        {infoGenerated && (
          <>
            <pre
              ref={preRef}
              contentEditable={true}
              className="alert alert-light small text-start border pre_editor"
              suppressContentEditableWarning={true}
              style={{
                whiteSpace: "pre-wrap",
                outline: "none",
                minHeight: "200px",
              }}
            />
            <div className="buttons">
              <button className="btn btn-success" onClick={handleCopy}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-copy"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"
                  />
                </svg>
                {"  Copy"}
              </button>
              <button className="btn btn-warning" onClick={handleInject}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-node-plus"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M11 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8M6.025 7.5a5 5 0 1 1 0 1H4A1.5 1.5 0 0 1 2.5 10h-1A1.5 1.5 0 0 1 0 8.5v-1A1.5 1.5 0 0 1 1.5 6h1A1.5 1.5 0 0 1 4 7.5zM11 5a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 11 5M1.5 7a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"
                  />
                </svg>
                {"  Inject"}
              </button>
            </div>
          </>
        )}

        <div className="text-center mt-3 json_link">
          {"Update Resolution Data? "}
          <Link to="/update-resolution">Click here</Link>
        </div>
      </div>
      <div className="footer text-center fst-italic">
        Developed with/for Walgreens by{" "}
        <a href="https://github.com/souloper" target="_blank">
          Soumya Das
        </a>
      </div>
    </>
  );
}

export default App;

// --------
// import React, { useEffect, useRef, useState } from 'react';
// import { Link } from 'react-router-dom';

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

//   const handleInject = async () => {
//     const text = preRef.current?.innerText;
//     if (!text) return alert('Nothing to inject.');

//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!tab.url.includes("https://walgreens.onbmc.com")) {
//       alert("Please navigate to the Walgreens Remedy page first.");
//       return;
//     }

//     await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: (info) => {
//         const textarea = document.getElementById("arid_WIN_4_1000000156");
//         if (textarea) {
//           textarea.value = info;
//           textarea.dispatchEvent(new Event("input", { bubbles: true }));
//           textarea.dispatchEvent(new Event("change", { bubbles: true }));
//         } else {
//           alert("Textarea with ID 'arid_WIN_4_1000000156' not found.");
//         }
//       },
//       args: [text]
//     });
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
//           <button className="btn btn-success w-100 btn-sm mb-2" onClick={handleCopy}>
//             Copy to Clipboard
//           </button>
//           <button className="btn btn-warning w-100 btn-sm" onClick={handleInject}>
//             Inject to Walgreens Remedy
//           </button>
//         </>
//       )}
//       <div className="text-center mt-3">
//         <Link to="/update-resolution">Updated resolution?</Link>
//       </div>
//     </div>
//   );
// }

// export default App;
// =======
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
