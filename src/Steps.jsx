import React from 'react';
import logo from "./assets/Walgreens.png"
import "./App.css"
import { Link } from 'react-router-dom';

const Steps = () => {
  return (
   <>
   <div className='container p-3' style={{ width: 330}}>
        <h4 className='text-center'>JSON file Replace</h4>
        <img src={logo} alt="logo" className='w-l' />
        <ul>
            <li>After converting Excel to JSON, File downloads automatically</li>
            <li>Check your Downloads folder</li>
            <li>Rename the downloaded file to: <span className='badge text-bg-secondary'>resolution.json</span></li>
            <li>Incorrect name will cause it to not work</li>
            <li>Refer to the presentation slide for the correct file path</li>
            <li>Place <span className='badge text-bg-secondary'>resolution.json</span> in that specific path <span className='badge text-bg-dark'>S:\SHARE23\Share23-TCS_CSO_DEV<br/>\Soumya\Resolution-extension-main v2.0.1<br/>\dist</span></li>
        </ul> 
        <Link to="/update-resolution">/back</Link>   
    </div>
        <div className='footer text-center fst-italic'>Developed with/for Walgreens by <a href="https://github.com/souloper" target="_blank">Soumya Das</a></div>
</>
  )
}

export default Steps