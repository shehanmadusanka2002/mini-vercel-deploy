import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// 🔥 ඔයාගේ Client ID එක
const CLIENT_ID = "Ov23lieyKoq6qVqRns2k"; 

function App() {
  const [token, setToken] = useState(null);
  const [repos, setRepos] = useState([]);
  const [deployments, setDeployments] = useState([]); // ✅ 1. අලුත් State එක
  
  const [gitURL, setGitUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [logs, setLogs] = useState('');

  // 1. Page Load වෙද්දී
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('token');

    if (accessToken) {
      setToken(accessToken);
      fetchRepos(accessToken);
      window.history.replaceState({}, document.title, "/");
    }

    // ✅ 2. Page එක Load වෙද්දී Deploy කරපු සයිට් ටික ගේනවා
    fetchDeployments();
  }, []);

  const fetchRepos = async (accessToken) => {
    try {
      const response = await axios.get('http://10.203.182.85:4000/repos', {
        headers: { Authorization: accessToken }
      });
      setRepos(response.data);
    } catch (error) {
      console.error("Failed to fetch repos", error);
    }
  };

  // ✅ 3. Deployments ගේන Function එක
  const fetchDeployments = async () => {
    try {
      const response = await axios.get('http://10.203.182.85:4000/deployments');
      setDeployments(response.data);
    } catch (error) { console.error("Deployments Fetch Error", error); }
  };

  const loginWithGithub = () => {
    window.location.assign(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`);
  };

  const handleDeploy = async () => {
    if(!gitURL || !slug) return alert("Please select a repo!");
    setLoading(true);
    setLogs("🚀 Sending deployment request...");
    
    try {
      const response = await axios.post('http://10.203.182.85:4000/project', {
        gitURL,
        slug
      });
      if (response.data.status === 'success') {
        setLogs("✅ Deployment Successful!");
        setResultUrl(response.data.url);
        fetchDeployments(); // ✅ 4. සාර්ථක වුනාම ලිස්ට් එක Refresh කරනවා
      }
    } catch (error) {
      setLogs("❌ Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repo) => {
    setGitUrl(repo.url);
    setSlug(repo.name);
  };

  return (
    <div style={{ 
      minHeight: '80vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        width: '100%',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '30px',
          textAlign: 'center',
          borderBottom: '4px solid #0f3460'
        }}>
          <h1 style={{ 
            color: '#fff', 
            margin: 0, 
            fontSize: '2.5em',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            letterSpacing: '1px'
          }}>🚀 Mini-Vercel Dashboard</h1>
          <p style={{ color: '#aaa', margin: '10px 0 0 0' }}>Deploy your projects in seconds</p>
        </div>

        <div style={{ padding: '40px' }}>
          {!token ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'float 3s ease-in-out infinite' }}>🐙</div>
              <h3 style={{ color: '#333', fontSize: '1.8em', marginBottom: '15px' }}>Welcome!</h3>
              <p style={{ color: '#666', fontSize: '1.1em', marginBottom: '30px' }}>Please login to see your projects.</p>
              <button onClick={loginWithGithub} style={{ padding: '18px 45px', background: 'linear-gradient(135deg, #333 0%, #000 100%)', color: '#fff', fontSize: '18px', cursor: 'pointer', border: 'none', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)', transition: 'all 0.3s ease' }}>
                 Login with GitHub 🐙
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              
              {/* වම් පැත්තේ Repo List එක */}
              <div style={{ flex: '1 1 350px', background: '#f8f9fa', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ color: '#1a1a2e', marginTop: 0, paddingBottom: '15px', borderBottom: '3px solid #667eea', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📂 Select a Repository
                </h3>
                <div style={{ height: 'calc(100vh - 450px)', maxHeight: '500px', minHeight: '300px', overflowY: 'auto', marginTop: '15px', background: 'white', borderRadius: '10px', border: '2px solid #e0e0e0' }}>
                  {repos.map((repo) => (
                    <div 
                      key={repo.url} 
                      onClick={() => handleRepoSelect(repo)}
                      style={{ 
                        padding: '15px 20px', borderBottom: '1px solid #eee', cursor: 'pointer', 
                        background: gitURL === repo.url ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        color: gitURL === repo.url ? 'white' : '#333',
                        fontWeight: gitURL === repo.url ? 'bold' : 'normal'
                      }}
                    >
                      <strong>{repo.name}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* දකුණු පැත්තේ Deploy Form සහ Live List එක */}
              <div style={{ flex: '1 1 350px', background: '#f8f9fa', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ color: '#1a1a2e', marginTop: 0, paddingBottom: '15px', borderBottom: '3px solid #667eea', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  ⚙️ Deploy Settings
                </h3>
                
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>Repo URL:</label>
                  <input type="text" value={gitURL} readOnly style={{ width: '100%', marginBottom: '20px', padding: '12px 15px', background: '#e8e8e8', border: '2px solid #ddd', borderRadius: '8px' }} />

                  <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>Project Name (Slug):</label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%', marginBottom: '25px', padding: '12px 15px', border: '2px solid #667eea', borderRadius: '8px' }} />

                  <button onClick={handleDeploy} disabled={loading} style={{ width: '100%', padding: '18px', background: loading ? '#ccc' : 'linear-gradient(135deg, #0070f3 0%, #00c6ff 100%)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '50px', fontSize: '16px', fontWeight: 'bold', boxShadow: loading ? 'none' : '0 8px 20px rgba(0, 112, 243, 0.4)' }}>
                    {loading ? '⏳ Deploying...' : 'Deploy Now 🚀'}
                  </button>

                  {resultUrl && (
                    <div style={{ marginTop: '25px', padding: '20px', background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', borderRadius: '10px', border: '2px solid #28a745' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#155724', fontWeight: 'bold' }}>✅ Deployment Successful!</p>
                      <a href={resultUrl} target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold', wordBreak: 'break-all' }}>🔗 {resultUrl}</a>
                    </div>
                  )}
                  
                  {logs && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '10px', color: '#856404' }}>{logs}</div>
                  )}

                  {/* ✅ 5. Live Deployments Section */}
                  <div style={{ marginTop: '30px', borderTop: '2px dashed #ccc', paddingTop: '20px' }}>
                    <h3 style={{ color: '#1a1a2e', fontSize: '1.2em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌍 Live Projects
                    </h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {deployments.length === 0 ? <p style={{color: '#999', fontStyle: 'italic'}}>No projects yet.</p> : (
                        deployments.map((project, index) => (
                          <div key={index} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', borderLeft: '5px solid #28a745', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{project.name}</h4>
                            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888' }}>{project.date}</p>
                            <a href={project.url} target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                              🔗 Visit Site
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;