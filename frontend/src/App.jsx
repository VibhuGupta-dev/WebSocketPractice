import { useState} from "react";
import { useNavigate } from 'react-router-dom';

import "./App.css";


function App() {
 
  const navigate = useNavigate();
  const [UserName, setUserName] = useState('');

  const submithandle = () => {
    if (!UserName) return
  
    navigate('/chat', { state: { userName: UserName } });
    
  };


  return (
    <>
      <div className="namepage">
        <div className="box">
          <h2>Enter Your Name</h2> <br />
          <div className="form">
            <input
              value={UserName}
              onChange={e => setUserName(e.target.value)}
              className="input1"
              type="text"
              placeholder="Enter Your Name"
            />
            <button
              type="button"
              onClick={submithandle}
              className="button1"
              disabled={!UserName} // Disable if no name entered
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;