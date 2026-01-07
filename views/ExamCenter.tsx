
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExamCard = ({ title, subtitle, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 text-left"
  >
    <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white text-3xl mb-6 group-hover:scale-110 transition-transform`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm mb-6 leading-relaxed">{subtitle}</p>
    <div className="flex items-center text-indigo-600 font-bold text-sm">
      Launch Session <i className="fas fa-chevron-right ml-2 text-xs"></i>
    </div>
  </button>
);

const ToeicPartBadge = ({ part, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all group"
  >
    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 font-bold">
      {part}
    </div>
    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600">{label}</span>
  </button>
);

const ExamCenter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Exam Prep Center 🎯</h2>
        <p className="text-slate-500 text-lg">Master real-world certifications with AI-generated mock tests.</p>
      </header>

      <section className="mb-12">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><i className="fas fa-file-alt"></i></span>
          TOEIC Practice & Tests
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <ExamCard 
            title="Full Simulated Test"
            subtitle="2 hours, 200 questions. Just like the real exam. Track your time and score accurately."
            icon="fa-stopwatch"
            color="bg-rose-500"
            onClick={() => navigate('/exam/toeic/test/all')}
          />
          <ExamCard 
            title="Writing & Speaking Lab"
            subtitle="Practice open-ended responses. Get instant AI grading and detailed feedback on your skills."
            icon="fa-pen-nib"
            color="bg-amber-500"
            onClick={() => navigate('/exam/toeic/practice/writing')}
          />
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Master specific parts</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ToeicPartBadge part={1} label="Photo Description" onClick={() => navigate('/exam/toeic/practice/1')} />
            <ToeicPartBadge part={2} label="Question & Response" onClick={() => navigate('/exam/toeic/practice/2')} />
            <ToeicPartBadge part={3} label="Conversations" onClick={() => navigate('/exam/toeic/practice/3')} />
            <ToeicPartBadge part={4} label="Short Talks" onClick={() => navigate('/exam/toeic/practice/4')} />
            <ToeicPartBadge part={5} label="Incomplete Sentences" onClick={() => navigate('/exam/toeic/practice/5')} />
            <ToeicPartBadge part={6} label="Text Completion" onClick={() => navigate('/exam/toeic/practice/6')} />
            <ToeicPartBadge part={7} label="Reading Comprehension" onClick={() => navigate('/exam/toeic/practice/7')} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-900 rounded-3xl p-10 text-white">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <div className="inline-block px-3 py-1 bg-emerald-500 text-xs font-bold rounded-full mb-4">NEW</div>
            <h3 className="text-3xl font-bold mb-4">IELTS Mock Exams</h3>
            <p className="text-slate-400 mb-6">Prepare for Academic or General Training with our updated IELTS modules. Includes full Speaking simulation.</p>
            <button className="bg-white text-slate-900 font-bold px-8 py-3 rounded-2xl hover:bg-slate-100 transition-all">
              Coming Soon
            </button>
          </div>
          <div className="hidden lg:block opacity-20">
            <i className="fas fa-globe text-[180px]"></i>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </section>
    </div>
  );
};

export default ExamCenter;
