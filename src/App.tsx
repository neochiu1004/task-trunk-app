import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <>
    <Toaster position="top-center" richColors />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
