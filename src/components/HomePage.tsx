import React from 'react';
import { Sparkles, Scissors, Heart, Zap } from 'lucide-react';

interface HomePageProps {
  onSuggestedQuestion: (question: string) => Promise<void>;
}

const suggestedQuestions = [
  {
    icon: Sparkles,
    title: "Hair Care Routine",
    question: "What's the best daily hair care routine for my hair type?",
    category: "Care"
  },
  {
    icon: Scissors,
    title: "Style Recommendations",
    question: "What hairstyles would complement my face shape?",
    category: "Styling"
  },
  {
    icon: Heart,
    title: "Damage Repair",
    question: "How can I repair damaged and brittle hair?",
    category: "Treatment"
  }
];

export function HomePage({ onSuggestedQuestion }: HomePageProps) {
  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="OUR HAIRITAGE" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl text-white mb-4">
            Welcome to OUR HAIRITAGE
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Your personal hair care consultant. Ask me anything about hair care, styling, treatments, and more. 
            Let's discover your hair's true potential together.
          </p>
        </div>

        {/* Suggested Questions */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold text-white text-center mb-8">
            Popular Questions to Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {suggestedQuestions.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => onSuggestedQuestion(item.question)}
                  className="group p-6 bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300 text-left h-full"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-white group-hover:text-gray-200 truncate">
                          {item.title}
                        </h3>
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 line-clamp-3">
                        {item.question}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Start a conversation by clicking on a question above or type your own question.
          </p>
        </div>
      </div>
    </div>
  );
}