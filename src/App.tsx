import { Header, Sidebar, MainContent, StatusBar } from './components/Layout';

function App() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
