import React, { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react";

const API_BASE = "http://localhost:5050";
const BACKEND_BASE = "http://localhost:3001";

function App() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  // Fetch flashcards from backend
  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE}/flashcards`);
      if (response.ok) {
        const data = await response.json();
        setFlashcards(data);
        if (data.length > 0) {
          setCurrentCardIndex(0);
          setStudyMode(true);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar flashcards:", error);
    }
  };

  // Upload PDF and create flashcards
  const handleSubmit = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadResponse(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${API_BASE}/upload-pdf`, {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      setUploadResponse(data);
      
      if (data.success) {
        // Wait a bit for flashcards to be created, then fetch them
        setTimeout(() => {
          fetchFlashcards();
        }, 2000);
      }
    } catch (error) {
      setUploadResponse({
        success: false,
        error: "Erro de conexão: " + error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Check user answer
  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    setIsCheckingAnswer(true);
    setFeedback(null);
    
    try {
      const formData = new FormData();
      formData.append("flashcard_id", flashcards[currentCardIndex].id.toString());
      formData.append("user_answer", userAnswer);
      
      const response = await fetch(`${API_BASE}/check-answer`, {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();
      setFeedback(result);
      setShowAnswer(true);
      
      // If correct, auto-advance after 3 seconds
      if (result.status === "correto") {
        setTimeout(() => {
          nextCard();
        }, 3000);
      }
    } catch (error) {
      setFeedback({
        status: "erro",
        feedback: "Erro ao verificar resposta: " + error.message,
        official_answer: ""
      });
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  // Move to next card
  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setUserAnswer("");
      setFeedback(null);
      setShowAnswer(false);
    }
  };

  // Move to previous card
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setUserAnswer("");
      setFeedback(null);
      setShowAnswer(false);
    }
  };

  // Reset to upload mode
  const resetToUpload = () => {
    setStudyMode(false);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setShowAnswer(false);
    setFile(null);
    setUploadResponse(null);
  };

  // Get feedback color and icon
  const getFeedbackStyle = (status) => {
    switch (status) {
      case "correto":
        return { color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle className="w-5 h-5" /> };
      case "parcial":
        return { color: "text-yellow-600", bg: "bg-yellow-50", icon: <AlertCircle className="w-5 h-5" /> };
      case "incorreto":
        return { color: "text-red-600", bg: "bg-red-50", icon: <XCircle className="w-5 h-5" /> };
      default:
        return { color: "text-gray-600", bg: "bg-gray-50", icon: <AlertCircle className="w-5 h-5" /> };
    }
  };

  // Load existing flashcards on component mount
  useEffect(() => {
    fetchFlashcards();
  }, []);

  const currentCard = flashcards[currentCardIndex];
  const feedbackStyle = feedback ? getFeedbackStyle(feedback.status) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Flashcard Study App</h1>
          <p className="text-gray-600">Carregue um PDF e crie flashcards inteligentes para estudar</p>
        </div>

        {!studyMode ? (
          // Upload Mode
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload PDF</h2>
              <p className="text-gray-600">Selecione um arquivo PDF para gerar flashcards automaticamente</p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <FileText className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-600">
                    {file ? file.name : "Clique para selecionar um arquivo PDF"}
                  </span>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!file || isUploading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Gerar Flashcards</span>
                  </>
                )}
              </button>
            </div>

            {uploadResponse && (
              <div className={`mt-6 p-4 rounded-lg ${uploadResponse.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="font-semibold mb-2">
                  {uploadResponse.success ? '✅ Sucesso!' : '❌ Erro'}
                </div>
                <div className="text-sm">
                  {uploadResponse.success ? uploadResponse.response : uploadResponse.error}
                </div>
              </div>
            )}

            {flashcards.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-800">
                      {flashcards.length} flashcards disponíveis
                    </div>
                    <div className="text-sm text-blue-600">
                      Pronto para começar a estudar!
                    </div>
                  </div>
                  <button
                    onClick={() => setStudyMode(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Começar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Study Mode
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Modo Estudo</h2>
                  <p className="text-gray-600">
                    Card {currentCardIndex + 1} de {flashcards.length}
                  </p>
                </div>
                <button
                  onClick={resetToUpload}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Voltar ao Upload
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Flashcard */}
            {currentCard && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    {currentCard.title}
                  </h3>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentCard.question}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sua resposta:
                    </label>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Digite sua resposta aqui..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="4"
                      disabled={showAnswer}
                    />
                  </div>

                  {!showAnswer && (
                    <button
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim() || isCheckingAnswer}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isCheckingAnswer ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <span>Verificar Resposta</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className={`mt-6 p-4 rounded-lg ${feedbackStyle.bg}`}>
                    <div className={`flex items-center space-x-2 ${feedbackStyle.color} font-semibold mb-2`}>
                      {feedbackStyle.icon}
                      <span className="capitalize">{feedback.status}</span>
                    </div>
                    <div className="text-gray-700 mb-3">
                      {feedback.feedback}
                    </div>
                    {feedback.official_answer && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Resposta oficial:
                        </div>
                        <div className="text-gray-800">
                          {feedback.official_answer}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {showAnswer && (
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={prevCard}
                      disabled={currentCardIndex === 0}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    
                    <button
                      onClick={nextCard}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentCardIndex === flashcards.length - 1 ? 'Finalizado' : 'Próximo →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
