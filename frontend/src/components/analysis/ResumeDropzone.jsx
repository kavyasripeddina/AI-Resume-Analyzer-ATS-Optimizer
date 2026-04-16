import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ResumeDropzone = ({ onFileAccepted, uploadProgress, isUploading }) => {
  const [dragError, setDragError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setDragError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setDragError('File exceeds 10MB limit. Please upload a smaller file.');
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setDragError('Only PDF and DOCX files are accepted.');
      } else {
        setDragError('Invalid file. Please upload a PDF or DOCX resume.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Edge case: empty file
      if (file.size === 0) {
        setDragError('The file appears to be empty. Please upload a valid resume.');
        return;
      }
      onFileAccepted(file);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`drop-zone ${isDragActive ? 'drag-over' : ''}`}
        style={{
          opacity: isUploading ? 0.7 : 1,
          cursor: isUploading ? 'not-allowed' : 'pointer',
          borderColor: isDragReject ? 'var(--color-danger)' : dragError ? 'var(--color-danger)' : undefined,
          background: isDragReject ? 'var(--color-danger-light)' : undefined,
          transition: 'all 0.2s ease',
        }}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '3rem' }}>⏫</div>
            <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>Uploading & Parsing Resume...</div>
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {uploadProgress}%
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{ fontSize: '3.5rem' }}
              className={isDragActive ? 'animate-float' : ''}
            >
              {isDragActive ? '📂' : isDragReject ? '❌' : '📄'}
            </div>

            {isDragActive ? (
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                Drop your resume here!
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-text)', marginBottom: '4px' }}>
                    Drag & drop your resume here
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    or <span style={{ color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>click to browse files</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span className="badge badge-primary">PDF</span>
                  <span className="badge badge-primary">DOCX</span>
                  <span className="badge" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}>
                    Max 10MB
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  💡 Upload a text-based PDF for best results. Image-only PDFs cannot be parsed.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {dragError && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'var(--color-danger-light)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px',
          color: 'var(--color-danger)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚠️ {dragError}
        </div>
      )}
    </div>
  );
};

export default ResumeDropzone;
