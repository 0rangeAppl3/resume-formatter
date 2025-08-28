import React, { useState, useRef, useEffect } from 'react';
import type { ResumeData, WorkExperience, Education, PortfolioProject } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';

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
    setEditableData(data);
  }, [data]);

  const handleDownloadPdf = () => {
    if (isEditing) {
      alert("Please save your changes before downloading.");
      return;
    }
    if (!resumeContentRef.current) return;

    const { jsPDF } = jspdf;
    const input = resumeContentRef.current;
    
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      let width = pdfWidth;
      let height = width / ratio;

      if (height > pdfHeight) {
         height = pdfHeight;
         width = height * ratio;
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${data.contactInfo.name.replace(' ', '_')}_Resume.pdf`);
    });
  };
  
  // Refactored handler for items in an array of objects (Work Experience, Education, etc.)
  const handleItemChange = (section: 'workExperience' | 'education' | 'portfolioProjects', index: number, field: string, value: any) => {
    setEditableData(prev => {
      const newArray = (prev[section] as any[]).map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, [section]: newArray };
    });
  };

  // Refactored handler for simple object properties (Contact Info)
  const handleContactInfoChange = (field: keyof ResumeData['contactInfo'], value: string) => {
    setEditableData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  // Refactored handler for deleting an item from an array
  const handleDeleteItem = (section: 'workExperience' | 'education' | 'portfolioProjects', index: number) => {
    setEditableData(prev => {
      const oldArray = (prev[section] as any[] | undefined) || [];
      return {
        ...prev,
        [section]: oldArray.filter((_, i) => i !== index),
      };
    });
  };
  
  // Refactored handler for deleting an entire optional section
  const handleDeleteSection = (section: 'qualifications' | 'portfolioProjects' | 'skills') => {
    setEditableData(prev => {
      const newData = { ...prev };
      if (section === 'skills') {
        newData.skills = []; // Cannot be undefined, so clear it
      } else {
        delete (newData as Partial<ResumeData>)[section];
      }
      return newData;
    });
  };

  // Refactored handler for adding a new item to an array
  const handleAddItem = (section: 'workExperience' | 'education' | 'portfolioProjects') => {
    setEditableData(prev => {
        let newItem: WorkExperience | Education | PortfolioProject;
        switch (section) {
            case 'workExperience':
                newItem = { jobTitle: 'New Job Title', company: 'Company Name', location: 'City, State', startDate: 'Month Year', endDate: 'Present', description: ['Responsibility or achievement'] };
                break;
            case 'education':
                newItem = { degree: 'Degree or Certificate', institution: 'Institution Name', location: 'City, State', graduationDate: 'Month Year' };
                break;
            case 'portfolioProjects':
                newItem = { projectName: 'New Project', description: 'Project description.', technologies: ['Tech 1', 'Tech 2'], link: '' };
                break;
        }
        const oldArray = (prev[section] as any[] | undefined) || [];
        return {
            ...prev,
            [section]: [...oldArray, newItem]
        }
    });
  };

  const handleSave = () => {
    onSave(editableData);
    onToggleEdit(false);
  };

  const handleCancel = () => {
    setEditableData(data);
    onToggleEdit(false);
  };

  const commonInputClass = "w-full p-1 bg-indigo-50 border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const commonTextareaClass = `${commonInputClass} min-h-[100px]`;
  const deleteButtonClass = "absolute top-0 right-0 mt-1 mr-1 p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors";
  const addButtonClass = "inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-md transition-colors text-xs";


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

    <div ref={resumeContentRef} className="p-2 bg-white">
      {/* Contact Info */}
      <div className="text-center border-b pb-4">
        {isEditing ? (
             <input type="text" value={editableData.contactInfo.name} onChange={e => handleContactInfoChange('name', e.target.value)} className={`${commonInputClass} text-3xl font-bold text-center mb-1`} />
        ) : (
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">{data.contactInfo.name}</h2>
        )}
        {isEditing ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
                <input type="text" value={editableData.contactInfo.location} onChange={e => handleContactInfoChange('location', e.target.value)} className={commonInputClass} placeholder="Location" />
                <input type="text" value={editableData.contactInfo.phone} onChange={e => handleContactInfoChange('phone', e.target.value)} className={commonInputClass} placeholder="Phone" />
                <input type="email" value={editableData.contactInfo.email} onChange={e => handleContactInfoChange('email', e.target.value)} className={commonInputClass} placeholder="Email" />
                <input type="text" value={editableData.contactInfo.linkedin || ''} onChange={e => handleContactInfoChange('linkedin', e.target.value)} className={commonInputClass} placeholder="LinkedIn URL" />
                <input type="text" value={editableData.contactInfo.portfolio || ''} onChange={e => handleContactInfoChange('portfolio', e.target.value)} className={`${commonInputClass} col-span-2`} placeholder="Portfolio URL" />
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
            <textarea value={editableData.summary} onChange={e => setEditableData(d => ({ ...d, summary: e.target.value}))} className={commonTextareaClass} />
        ) : (
            <p className="text-slate-600">{data.summary}</p>
        )}
      </div>

      {/* Qualifications */}
      {(data.qualifications && data.qualifications.length > 0 || isEditing) && (
        <div className="section relative">
            <h3 className="section-title">Qualifications</h3>
             {isEditing ? (
                <>
                <button onClick={() => handleDeleteSection('qualifications')} className={deleteButtonClass} title="Delete Qualifications Section">
                    <TrashIcon className="w-5 h-5" />
                </button>
                <textarea 
                    value={editableData.qualifications?.join('\n') || ''} 
                    onChange={e => setEditableData(d => ({...d, qualifications: e.target.value.split('\n')}))} 
                    className={commonTextareaClass}
                    placeholder="Enter qualifications, one per line."
                />
                </>
             ) : (
                data.qualifications && data.qualifications.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-1 text-slate-600">
                        {data.qualifications.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                )
             )}
        </div>
      )}
      
      {/* Work Experience */}
      <div className="section">
        <h3 className="section-title">Work Experience</h3>
        <div className="space-y-4">
          {(isEditing ? editableData.workExperience : data.workExperience).map((job, index) => {
            if (!job || typeof job !== 'object' || !job.jobTitle) {
              return null;
            }
            
            return (
              <div key={index} className="relative p-2 border-transparent hover:border-red-100 border rounded">
                {isEditing ? (
                    <>
                    <button onClick={() => handleDeleteItem('workExperience', index)} className={deleteButtonClass} title="Delete Experience">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <div className="space-y-1">
                        <input type="text" value={job.jobTitle} onChange={e => handleItemChange('workExperience', index, 'jobTitle', e.target.value)} className={`${commonInputClass} font-bold`} />
                        <input type="text" value={job.company} onChange={e => handleItemChange('workExperience', index, 'company', e.target.value)} className={commonInputClass} />
                        <div className="flex gap-2">
                          <input type="text" value={job.location} onChange={e => handleItemChange('workExperience', index, 'location', e.target.value)} className={commonInputClass} />
                          <input type="text" value={job.startDate} onChange={e => handleItemChange('workExperience', index, 'startDate', e.target.value)} className={commonInputClass} />
                          <input type="text" value={job.endDate} onChange={e => handleItemChange('workExperience', index, 'endDate', e.target.value)} className={commonInputClass} />
                        </div>
                        <textarea value={(job.description || []).join('\n')} onChange={e => handleItemChange('workExperience', index, 'description', e.target.value.split('\n'))} className={`${commonTextareaClass} mt-2`} />
                    </div>
                    </>
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
                          {(job.description || []).filter(desc => desc && desc.trim().length > 0).map((desc, i) => (<li key={i}>{desc}</li>))}
                      </ul>
                  </>
                )}
              </div>
            )
          })}
        </div>
        {isEditing && (
            <div className="mt-4 text-center">
                <button onClick={() => handleAddItem('workExperience')} className={addButtonClass}>
                    <PlusIcon className="w-4 h-4" />
                    Add Experience
                </button>
            </div>
        )}
      </div>
      
      {/* Education */}
       <div className="section">
        <h3 className="section-title">Education</h3>
         <div className="space-y-4">
            {(isEditing ? editableData.education : data.education).map((edu, index) => (
                <div key={index} className="relative p-2 border-transparent hover:border-red-100 border rounded">
                     {isEditing ? (
                        <>
                        <button onClick={() => handleDeleteItem('education', index)} className={deleteButtonClass} title="Delete Education">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <div className="space-y-1 mb-2">
                            <input type="text" value={edu.degree} onChange={e => handleItemChange('education', index, 'degree', e.target.value)} className={`${commonInputClass} font-bold`} />
                            <div className="flex gap-2">
                                <input type="text" value={edu.institution} onChange={e => handleItemChange('education', index, 'institution', e.target.value)} className={commonInputClass} />
                                <input type="text" value={edu.location} onChange={e => handleItemChange('education', index, 'location', e.target.value)} className={commonInputClass} />
                                <input type="text" value={edu.graduationDate} onChange={e => handleItemChange('education', index, 'graduationDate', e.target.value)} className={commonInputClass} />
                            </div>
                        </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-slate-800">{edu.degree}</h4>
                                <p className="text-slate-500 font-medium">{edu.graduationDate}</p>
                            </div>
                            <p className="text-slate-600">{edu.institution}, {edu.location}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
        {isEditing && (
            <div className="mt-4 text-center">
                <button onClick={() => handleAddItem('education')} className={addButtonClass}>
                    <PlusIcon className="w-4 h-4" />
                    Add Education
                </button>
            </div>
        )}
      </div>

       {/* Portfolio Projects */}
        {(data.portfolioProjects && data.portfolioProjects.length > 0 || isEditing) && (
            <div className="section">
                <h3 className="section-title">Portfolio Projects</h3>
                <div className="space-y-4">
                {(isEditing ? editableData.portfolioProjects : data.portfolioProjects)?.map((project, index) => (
                    <div key={index} className="relative p-2 border-transparent hover:border-red-100 border rounded">
                        {isEditing ? (
                            <>
                            <button onClick={() => handleDeleteItem('portfolioProjects', index)} className={deleteButtonClass} title="Delete Project">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                            <div className="space-y-1">
                                <input type="text" value={project.projectName} onChange={e => handleItemChange('portfolioProjects', index, 'projectName', e.target.value)} className={`${commonInputClass} font-bold`} />
                                <input type="text" value={project.link || ''} onChange={e => handleItemChange('portfolioProjects', index, 'link', e.target.value)} className={commonInputClass} placeholder="Project Link (optional)" />
                                <textarea value={project.description} onChange={e => handleItemChange('portfolioProjects', index, 'description', e.target.value)} className={commonTextareaClass} placeholder="Project description..." />
                                <input type="text" value={project.technologies.join(', ')} onChange={e => handleItemChange('portfolioProjects', index, 'technologies', e.target.value.split(',').map(s=>s.trim()))} className={commonInputClass} placeholder="Technologies (comma-separated)" />
                            </div>
                            </>
                        ) : (
                            <div>
                                <div className="flex justify-between items-baseline">
                                    <h4 className="font-bold text-slate-800">{project.projectName}</h4>
                                    {project.link && <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View Project</a>}
                                </div>
                                <p className="text-slate-600 my-1">{project.description}</p>
                                <p className="text-sm text-slate-500">
                                    <span className="font-semibold">Technologies:</span> {project.technologies.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
                </div>
                 {isEditing && (
                    <div className="mt-4 text-center">
                        <button onClick={() => handleAddItem('portfolioProjects')} className={addButtonClass}>
                            <PlusIcon className="w-4 h-4" />
                            Add Project
                        </button>
                    </div>
                )}
            </div>
        )}


      {/* Skills */}
      <div className="section relative">
        <h3 className="section-title">Skills</h3>
        {isEditing ? (
            <>
            <button onClick={() => handleDeleteSection('skills')} className={deleteButtonClass} title="Delete Skills Section">
                <TrashIcon className="w-5 h-5" />
            </button>
            <input type="text" value={editableData.skills.join(', ')} onChange={e => setEditableData(d => ({ ...d, skills: e.target.value.split(',').map(s => s.trim())}))} className={commonInputClass} />
            </>
        ) : (
            <p className="text-slate-600">{data.skills.join(' • ')}</p>
        )}
      </div>

    </div> {/* end resumeContentRef */}

      <style>{`
        .section { margin-top: 1.5rem; }
        .section-title {
          font-size: 1.125rem; /* text-lg */
          font-weight: 700;
          color: #1e293b; /* slate-800 */
          border-bottom: 2px solid #e2e8f0; /* slate-200 */
          padding-bottom: 0.75rem; /* Increased padding to fix PDF rendering overlap */
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