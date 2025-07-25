import React from 'react';

const PersonCard = ({ person, index }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6 mb-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {person.name !== '未提供' ? person.name.charAt(0) : '?'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {person.name !== '未提供' ? person.name : `候选人 ${index + 1}`}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {person.tag && person.tag.split(',').map((tag, tagIndex) => (
                <span 
                  key={tagIndex}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* 匹配度指示器 */}
        <div className="flex flex-col items-end">
          <div className="text-sm text-slate-500 mb-1">匹配度</div>
          <div className="flex items-center space-x-1">
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full" style={{width: '85%'}}></div>
            </div>
            <span className="text-sm font-semibold text-green-600">85%</span>
          </div>
        </div>
      </div>

      {/* 描述内容 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-600 mb-2">职位描述</h4>
        <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">
          {person.description !== '未提供' ? person.description : '暂无详细描述'}
        </p>
      </div>

      {/* 详细信息 */}
      <div className="space-y-2 mb-4">
        {person.MBTI && person.MBTI !== '未提供' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 w-12">MBTI:</span>
            <span className="text-sm font-medium text-slate-700 px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {person.MBTI}
            </span>
          </div>
        )}
        
        {person.contact && person.contact !== '未提供' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 w-12">联系:</span>
            <span className="text-sm text-slate-700">{person.contact}</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-2">
        <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
          查看详情
        </button>
        <button className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-all duration-200">
          联系TA
        </button>
      </div>
    </div>
  );
};

export default PersonCard;