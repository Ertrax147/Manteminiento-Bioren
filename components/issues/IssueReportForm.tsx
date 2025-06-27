// components/issues/IssueReportForm.tsx

import React, { useState, useEffect } from 'react';
import { IssueReport, IssueSeverity, Equipment } from '../../types';
import Button from '../ui/Button';
import SelectInput from '../ui/SelectInput';
import TextareaInput from '../ui/TextareaInput';
import FileInput from '../ui/FileInput';
import { ISSUE_SEVERITY_OPTIONS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface IssueReportFormProps {
    initialData?: IssueReport | null;
    equipmentIdFromUrl?: string;
    onSubmit: (issueReport: any) => void;
    onCancel: () => void;
    onFileChange: (file: File | null) => void; // <-- Prop para notificar el cambio de archivo
}

const IssueReportForm: React.FC<IssueReportFormProps> = ({ initialData, equipmentIdFromUrl, onSubmit, onCancel, onFileChange }) => {
    const { currentUser } = useAuth();

    const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState<Partial<IssueReport>>(
        initialData || {
            equipmentId: equipmentIdFromUrl || '',
            severity: IssueSeverity.MINOR,
            status: 'Abierto',
        }
    );
    const [errors, setErrors] = useState<Partial<Record<keyof IssueReport, string>>>({});

    useEffect(() => {
        const fetchEquipmentList = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/equipment');
                if (!response.ok) throw new Error('No se pudo cargar la lista de equipos.');
                const data: Equipment[] = await response.json();

                if (currentUser?.role === 'Jefe de Unidad' && currentUser.unit) {
                    setAvailableEquipment(data.filter(eq => eq.locationUnit === currentUser.unit));
                } else {
                    setAvailableEquipment(data);
                }
            } catch (error) {
                console.error(error);
                alert("Error: No se pudo cargar la lista de equipos desde el servidor.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEquipmentList();
    }, [currentUser]);

    useEffect(() => {
        if (equipmentIdFromUrl && !initialData) {
            setFormData(prev => ({ ...prev, equipmentId: equipmentIdFromUrl }));
        }
    }, [equipmentIdFromUrl, initialData]);

    const equipmentOptions = availableEquipment.map(eq => ({ value: eq.id, label: `${eq.name} (${eq.id})` }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // La lógica de validación se mantiene igual
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof IssueReport, string>> = {};
        if (!formData.equipmentId) newErrors.equipmentId = 'La selección del equipo es requerida.';
        if (!formData.description?.trim()) newErrors.description = 'La descripción de la incidencia es requerida.';
        if (!formData.severity) newErrors.severity = 'El nivel de severidad es requerido.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const selectedEquipmentName = availableEquipment.find(eq => eq.id === formData.equipmentId)?.name || 'Equipo Desconocido';
            const finalData = {
                ...formData,
                equipmentName: selectedEquipmentName,
            };
            onSubmit(finalData);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Cargando lista de equipos...</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {initialData ? 'Editar Reporte de Incidencia' : 'Reportar Nueva Incidencia'}
            </h2>

            <SelectInput
                label="Seleccionar Equipo" id="equipmentId" name="equipmentId"
                options={equipmentOptions} value={formData.equipmentId || ''}
                onChange={handleChange} error={errors.equipmentId}
                required disabled={!!equipmentIdFromUrl && !initialData}
            />
            <TextareaInput
                label="Descripción de la Incidencia" id="description" name="description"
                value={formData.description || ''} onChange={handleChange}
                error={errors.description} required rows={5}
            />
            <SelectInput
                label="Severidad" id="severity" name="severity"
                options={ISSUE_SEVERITY_OPTIONS} value={formData.severity || ''}
                onChange={handleChange} error={errors.severity} required
            />
            {/* --- LÍNEA CORREGIDA --- */}
            {/* Ahora el FileInput llama directamente a la función onFileChange que le pasamos como prop */}
            <FileInput
                label="Adjuntar Imagen o PDF (Opcional)" id="attachment" name="attachment"
                accept=".pdf,.png,.jpg,.jpeg" onFileChange={onFileChange}
            />

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary">
                    {initialData ? 'Guardar Cambios' : 'Enviar Reporte'}
                </Button>
            </div>
        </form>
    );
};

export default IssueReportForm;