import { useState, useCallback } from 'react'
import axios from 'axios'
import './App.css'

const MIN_FILE_SIZE = 100; // KB
const MAX_FILE_SIZE = 5000; // KB
const DEFAULT_FILE_SIZE = 800; // KB
const DEFAULT_QUALITY = 80;

const API_URL = 'http://localhost:3009';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [compressedImageUrl, setCompressedImageUrl] = useState<{ url: string, size: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [maxFileSize, setMaxFileSize] = useState<number>(DEFAULT_FILE_SIZE)
  const [quality, setQuality] = useState<number>(DEFAULT_QUALITY)
  const [isDragging, setIsDragging] = useState(false)
  const [compressionMode, setCompressionMode] = useState<'quality' | 'size'>('quality')

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      setSelectedFile(files[0])
      setCompressedImageUrl(null)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleCompress = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('maxFileSize', maxFileSize.toString())
      formData.append('quality', quality.toString())
      formData.append('mode', compressionMode)

      const response = await axios.post(`${API_URL}${API_URL.includes('/api') ? '' : '/api'}/compress`, formData, {
        responseType: 'blob'
      })

      const compressedSize = response.data.size;
      const url = URL.createObjectURL(response.data)
      setCompressedImageUrl({ url, size: compressedSize });
    } catch (error) {
      console.error('Error compressing image:', error)
      alert('Failed to compress image')
    } finally {
      setLoading(false)
    }
  }

  const handleMaxFileSizeChange = (value: number) => {
    const size = Math.min(Math.max(value, MIN_FILE_SIZE), MAX_FILE_SIZE);
    setMaxFileSize(size);
  }

  return (
    <div className="container">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-icon">
          <img src="/image-icon.svg" alt="Upload" />
        </div>
        <button className="select-button" onClick={() => document.getElementById('file-input')?.click()}>
          Select Images
        </button>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files)}
          style={{ display: 'none' }}
        />
        <p className="drag-text">or, drag and drop images here</p>
      </div>

      <div className="settings-panel">
        <h3>Compression Settings (optional)</h3>
        <div className="setting-item">
          <label className="mode-selector">
            Compression Mode:
            <select
              value={compressionMode}
              onChange={(e) => setCompressionMode(e.target.value as 'quality' | 'size')}
            >
              <option value="quality">Quality Based</option>
              <option value="size">Size Based</option>
            </select>
          </label>
        </div>
        {compressionMode === 'size' ? (
          <div className="setting-item">
            <label>
              Max File Size (KB)
              <input
                type="number"
                value={maxFileSize}
                onChange={(e) => handleMaxFileSizeChange(Number(e.target.value))}
                placeholder="Enter Max File Size"
                min={MIN_FILE_SIZE}
                max={MAX_FILE_SIZE}
              />
            </label>
          </div>
        ) : (
          <div className="setting-item">
            <label>
              Quality
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <span>{quality}%</span>
            </label>
          </div>
        )}
      </div>

      <div className="image-comparison">
        <div className="image-card">
          <h2>Original Image</h2>
          <div className="image-container">
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Original" />
            ) : (
              <div className="placeholder">
                <p>No image selected</p>
              </div>
            )}
          </div>
          <div className="image-info">
            {selectedFile ? (
              <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            ) : (
              <p>Size: -- KB</p>
            )}
          </div>
          <button
            className="compress-button"
            onClick={handleCompress}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Compressing...' : 'Compress Image'}
          </button>
        </div>

        <div className="image-card">
          <h2>Compressed Image</h2>
          <div className="image-container">
            {compressedImageUrl ? (
              <img src={compressedImageUrl.url} alt="Compressed" />
            ) : (
              <div className="placeholder">
                <p>No compressed image yet</p>
              </div>
            )}
          </div>
          <div className="image-info">
            {compressedImageUrl ? (
              <>
                <p>Size: {(compressedImageUrl.size / 1024).toFixed(2)} KB</p>
                <p>Reduced by {((1 - compressedImageUrl.size / selectedFile!.size) * 100).toFixed(1)}%</p>
              </>
            ) : (
              <p>Size: -- KB</p>
            )}
          </div>
          {compressedImageUrl && (
            <button
              className="download-button"
              onClick={() => {
                const link = document.createElement('a');
                link.href = compressedImageUrl.url;
                link.download = 'compressed-image.jpg';
                link.click();
              }}
            >
              Download Compressed Image
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 