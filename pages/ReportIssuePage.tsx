// pages/ReportIssuePage.tsx

import React, { useState } from 'react'; // <-- Añadimos useState aquí
import { useNavigate, useLocation } from 'react-router-dom';
import IssueReportForm from '../components/issues/IssueReportForm';
import { IssueReport } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const equipmentIdFromUrl = queryParams.get('equipmentId') || undefined;

  // La función que se pasa al formulario para manejar la subida
  const handleFileChange = (file: File | null) => {
    setAttachmentFile(file);
  };

  const handleSubmitIssue = async (issueReportData: Omit<IssueReport, 'id' | 'dateTime' | 'reportedBy' | 'attachments'>) => {
    if (!currentUser) {
      alert("Error: Debes estar logueado para reportar una incidencia.");
      return;
    }

    // Usamos FormData para poder enviar texto y archivos juntos
    const formData = new FormData();
    formData.append('equipmentId', issueReportData.equipmentId);
    formData.append('equipmentName', issueReportData.equipmentName || 'Desconocido');
    formData.append('description', issueReportData.description);
    formData.append('severity', issueReportData.severity);
    formData.append('reportedBy', currentUser.name);

    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    try {
      const response = await fetch('http://localhost:4000/api/issues', {
        method: 'POST',
        body: formData, // Al usar FormData, no se pone el header 'Content-Type'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al reportar la incidencia.');
      }

      alert('¡Incidencia reportada exitosamente!');
      navigate('/issues');

    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Ocurrió un error"}`);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
      <div className="max-w-2xl mx-auto">
        {/* Le pasamos la nueva función handleFileChange al formulario */}
        <IssueReportForm
            onSubmit={handleSubmitIssue}
            onCancel={handleCancel}
            onFileChange={handleFileChange}
            equipmentIdFromUrl={equipmentIdFromUrl}
        />
      </div>
  );
};

export default ReportIssuePage;