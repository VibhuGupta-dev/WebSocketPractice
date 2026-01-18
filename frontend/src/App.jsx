import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import "./App.css";
function App() {
  const navigate = useNavigate() 
  const [UserName, setUserName] = useState('');
 

  const submithandle = () => {
    if(!UserName) {
      return
    }else{
     navigate('/chat' , {state : {userName : UserName}})
    }
  
  }

  return (
    <>
    <div className="namepage">

      <div className="box">
        <h2>Enter Your Name </h2> <br></br>
        <div className="form">
          <input
          value={UserName}
          onChange={e => setUserName(e.target.value)}
            className="input1"
            type="text"
            placeholder="Enter Your Name"
          ></input>
          <button type = "button" onClick = {submithandle} className="button1">Submit</button>
        </div>
       
      </div>

    </div>
    </>
  );
}

export default App;
