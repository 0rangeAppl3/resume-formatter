import React, { useState, useRef, useEffect } from 'react';
import type { ResumeData } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditIcon } from './icons/EditIcon';

// This makes TypeScript happy, as these libraries are loaded from a CDN.
declare const jspdf: any;
declare const html2canvas: any;

interface ResumePreviewProps {
  data: ResumeData;
  isEditing: boolean;
  onToggleEdit: (isEditing: boolean) => void;
  onSave: (newData: ResumeData) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, isEditing, onToggleEdit, onSave }) => {
  const [editableData, setEditableData] = useState<ResumeData>(data);
  const resumeContentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Sync local state if the prop data changes (e.g., after a new generation)
    setEditableData(data);
  }, [data]);

  const handleDownloadPdf = () => {
    if (!resumeContentRef.current) return;
    const { jsPDF } = jspdf;
    const input = resumeContentRef.current;
    
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      if (height > pdfHeight) {
         // TODO: Handle multi-page PDFs if content is too long
         console.warn("Content might be too long for a single PDF page.");
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${data.contactInfo.name.replace(' ', '_')}_Resume.pdf`);
    });
  };
  
  // FIX: Update 'value' parameter type to allow for string arrays (for work experience description).
  const handleInputChange = (section: keyof ResumeData, field: string, value: string | string[], index?: number, subIndex?: number) => {
    setEditableData(prev => {
        const newData = JSON.parse(JSON.stringify(prev)); // Deep copy
        if (index !== undefined) {
             if (subIndex !== undefined) {
                 // For nested arrays like workExperience description
                 (newData[section] as any)[index][field][subIndex] = value;
             } else {
                 (newData[section] as any)[index][field] = value;
             }
        } else if (section === 'skills') {
            // FIX: Add type guard since value can be a string array, but skills expects a string to split.
            if (typeof value === 'string') {
                newData.skills = value.split(',').map(s => s.trim());
            }
        } else {
            (newData[section] as any)[field] = value;
        }
        return newData;
    });
  };

  const handleSave = () => {
    onSave(editableData);
    onToggleEdit(false);
  };

  const handleCancel = () => {
    setEditableData(data); // Revert changes
    onToggleEdit(false);
  };

  const commonInputClass = "w-full p-1 bg-indigo-50 border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const commonTextareaClass = `${commonInputClass} min-h-[100px]`;

  return (
    <div className="space-y-6 animate-fade-in text-sm">
      <div className="flex justify-end items-center gap-2">
         {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors text-xs"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-md transition-colors text-xs"
              >
                Cancel
              </button>
            </>
         ) : (
            <>
              <button
                onClick={() => onToggleEdit(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors text-xs"
              >
                <EditIcon className="w-4 h-4" />
                Edit Resume
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors text-xs"
              >
                <DownloadIcon className="w-4 h-4" />
                Download PDF
              </button>
            </>
         )}
      </div>

    <div ref={resumeContentRef} className="p-2"> {/* Padding for PDF capture */}
      {/* Contact Info */}
      <div className="text-center border-b pb-4">
        {isEditing ? (
             <input type="text" value={editableData.contactInfo.name} onChange={e => handleInputChange('contactInfo', 'name', e.target.value)} className={`${commonInputClass} text-3xl font-bold text-center mb-1`} />
        ) : (
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">{data.contactInfo.name}</h2>
        )}
        {isEditing ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
                <input type="text" value={editableData.contactInfo.location} onChange={e => handleInputChange('contactInfo', 'location', e.target.value)} className={commonInputClass} placeholder="Location" />
                <input type="text" value={editableData.contactInfo.phone} onChange={e => handleInputChange('contactInfo', 'phone', e.target.value)} className={commonInputClass} placeholder="Phone" />
                <input type="email" value={editableData.contactInfo.email} onChange={e => handleInputChange('contactInfo', 'email', e.target.value)} className={commonInputClass} placeholder="Email" />
                <input type="text" value={editableData.contactInfo.linkedin || ''} onChange={e => handleInputChange('contactInfo', 'linkedin', e.target.value)} className={commonInputClass} placeholder="LinkedIn URL" />
                <input type="text" value={editableData.contactInfo.portfolio || ''} onChange={e => handleInputChange('contactInfo', 'portfolio', e.target.value)} className={`${commonInputClass} col-span-2`} placeholder="Portfolio URL" />
            </div>
        ) : (
            <p className="text-slate-500 mt-1">
                {data.contactInfo.location} • {data.contactInfo.phone} • <a href={`mailto:${data.contactInfo.email}`} className="text-indigo-600 hover:underline">{data.contactInfo.email}</a>
                {data.contactInfo.linkedin && ( <> • <a href={data.contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">LinkedIn</a></> )}
                {data.contactInfo.portfolio && ( <> • <a href={data.contactInfo.portfolio} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Portfolio</a></> )}
            </p>
        )}
      </div>

      {/* Summary */}
      <div className="section">
        <h3 className="section-title">Summary</h3>
        {isEditing ? (
            <textarea value={editableData.summary} onChange={e => handleInputChange('summary', '', e.target.value)} className={commonTextareaClass} />
        ) : (
            <p className="text-slate-600">{data.summary}</p>
        )}
      </div>
      
      {/* Work Experience */}
      <div className="section">
        <h3 className="section-title">Work Experience</h3>
        <div className="space-y-4">
          {data.workExperience.map((job, index) => (
            <div key={index}>
              {isEditing ? (
                  <div className="space-y-1">
                      <input type="text" value={editableData.workExperience[index].jobTitle} onChange={e => handleInputChange('workExperience', 'jobTitle', e.target.value, index)} className={`${commonInputClass} font-bold`} />
                      <input type="text" value={editableData.workExperience[index].company} onChange={e => handleInputChange('workExperience', 'company', e.target.value, index)} className={commonInputClass} />
                      <div className="flex gap-2">
                        <input type="text" value={editableData.workExperience[index].location} onChange={e => handleInputChange('workExperience', 'location', e.target.value, index)} className={commonInputClass} />
                        <input type="text" value={editableData.workExperience[index].startDate} onChange={e => handleInputChange('workExperience', 'startDate', e.target.value, index)} className={commonInputClass} />
                        <input type="text" value={editableData.workExperience[index].endDate} onChange={e => handleInputChange('workExperience', 'endDate', e.target.value, index)} className={commonInputClass} />
                      </div>
                      <textarea value={editableData.workExperience[index].description.join('\n')} onChange={e => handleInputChange('workExperience', 'description', e.target.value.split('\n'), index)} className={`${commonTextareaClass} mt-2`} />
                  </div>
              ) : (
                <>
                    <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-slate-800">{job.jobTitle}</h4>
                        <p className="text-slate-500 font-medium">{job.startDate} &ndash; {job.endDate}</p>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-slate-600">{job.company}</p>
                        <p className="text-slate-500">{job.location}</p>
                    </div>
                    <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-slate-600">
                        {job.description.map((desc, i) => (<li key={i}>{desc}</li>))}
                    </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Education */}
       <div className="section">
        <h3 className="section-title">Education</h3>
         {isEditing ? (
            data.education.map((edu, index) => (
                <div key={index} className="space-y-1 mb-2">
                    <input type="text" value={editableData.education[index].degree} onChange={e => handleInputChange('education', 'degree', e.target.value, index)} className={`${commonInputClass} font-bold`} />
                    <div className="flex gap-2">
                        <input type="text" value={editableData.education[index].institution} onChange={e => handleInputChange('education', 'institution', e.target.value, index)} className={commonInputClass} />
                        <input type="text" value={editableData.education[index].location} onChange={e => handleInputChange('education', 'location', e.target.value, index)} className={commonInputClass} />
                        <input type="text" value={editableData.education[index].graduationDate} onChange={e => handleInputChange('education', 'graduationDate', e.target.value, index)} className={commonInputClass} />
                    </div>
                </div>
            ))
         ) : (
            <div className="space-y-2">
                {data.education.map((edu, index) => (
                    <div key={index}>
                    <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-slate-800">{edu.degree}</h4>
                        <p className="text-slate-500 font-medium">{edu.graduationDate}</p>
                    </div>
                    <p className="text-slate-600">{edu.institution}, {edu.location}</p>
                    </div>
                ))}
            </div>
         )}
      </div>

      {/* Skills */}
      <div className="section">
        <h3 className="section-title">Skills</h3>
        {isEditing ? (
            <input type="text" value={editableData.skills.join(', ')} onChange={e => handleInputChange('skills', '', e.target.value)} className={commonInputClass} />
        ) : (
            <p className="text-slate-600">{data.skills.join(' • ')}</p>
        )}
      </div>

    </div> {/* end resumeContentRef */}

      <style>{`
        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b; /* slate-800 */
          border-bottom: 2px solid #e2e8f0; /* slate-200 */
          padding-bottom: 0.25rem;
          margin-bottom: 0.75rem;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};