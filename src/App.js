import './App.css';
import TheOfficeWriters from './components/TheOffice-Writers.js'
import TheOfficeWords from './components/TheOffice-Words.js'
import TheOfficeLineSearch from './components/TheOffice-LineSearch.js'

function App() {
  return (
    <div className="App">
      <TheOfficeWriters/>
      <TheOfficeWords/>
      <TheOfficeLineSearch/>
    </div>
  );
}

export default App;
