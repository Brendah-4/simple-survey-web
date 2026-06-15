import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SurveyManagement from './pages/SurveyManagement';
import QuestionManagement from './pages/QuestionManagement';
import AvailableSurveys from './pages/AvailableSurveys';
import SurveyForm from './pages/SurveyForm';
import SurveyResponses from './pages/SurveyResponses';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/surveys" replace />} />
          <Route path="/admin/surveys" element={<SurveyManagement />} />
          <Route path="/admin/questions" element={<QuestionManagement />} />
          <Route path="/admin/responses" element={<SurveyResponses />} />
          <Route path="/surveys" element={<AvailableSurveys />} />
          <Route path="/surveys/:id/take" element={<SurveyForm />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
