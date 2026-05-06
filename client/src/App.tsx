import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/ping`)
        .then(res => setStatus(res.data.status))
        .catch(() => setStatus('cannot reach backend'))
  }, [])

  return (
      <div>
        <h1>Pet Feeder</h1>
        <p>Backend status: <strong>{status}</strong></p>
      </div>
  )
}

export default App