import React, {useState} from "react";

function App() {

  const [file, setFile] = useState<File>();

  const handleSubmit = async () =>{
    const formData = new FormData();
    formData.append("file", file)
    const response = await fetch("http://localhost:5050/upload-pdf",{
      method: "POST",
      body: formData
  });

  const data = await response.json();
  console.log(data)
  }

  return (
    <>
      <input type="file" onChange={(e)=> setFile((e.target as HTMLInputElement).files[0])}/>
      <button onClick={handleSubmit}>submit</button>
    </>
  )
}

export default App
