// pages/AddEquipmentPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import EquipmentForm from '../components/equipment/EquipmentForm';

const AddEquipmentPage: React.FC = () => {
    const navigate = useNavigate();

    // handleSubmit ahora recibe FormData
    const handleSubmit = async (formData: FormData) => {
        try {
            const response = await fetch('http://localhost:4000/api/equipment', {
                method: 'POST',
                body: formData, // No se necesita 'Content-Type', el navegador lo pone solo
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar el equipo');
            }

            alert('¡Equipo registrado exitosamente!');
            navigate('/equipment');

        } catch (error) {
            console.error('Error en el handleSubmit:', error);
            alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleCancel = () => {
        navigate('/equipment');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <EquipmentForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default AddEquipmentPage;    