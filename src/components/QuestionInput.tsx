import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import './QuestionInput.css';

interface Props {
  onSubmit: (question: string) => void;
  placeholder?: string;
}

const exampleQuestions = [
  "What should I focus on today?",
  "How can I improve my relationships?",
  "What career path should I take?",
  "What do I need to let go of?",
  "What is coming my way?",
];

export default function QuestionInput({ onSubmit, placeholder = "Ask the cards..." }: Props) {
  const [question, setQuestion] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setQuestion(example);
    setShowExamples(false);
  };

  return (
    <div className="question-input-container">
      <div className="question-input-wrapper">
        <textarea
          className="question-textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={200}
        />
        <div className="question-input-footer">
          <span className="char-count">{question.length}/200</span>
          <button
            className="question-submit-btn"
            onClick={handleSubmit}
            disabled={!question.trim()}
          >
            <Sparkles size={16} />
            <span>Ask the Cards</span>
          </button>
        </div>
      </div>

      <button
        className="examples-toggle"
        onClick={() => setShowExamples(!showExamples)}
      >
        {showExamples ? 'Hide examples' : 'Show examples'} ✦
      </button>

      {showExamples && (
        <motion.div
          className="examples-list"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {exampleQuestions.map((example, idx) => (
            <button
              key={idx}
              className="example-item"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}