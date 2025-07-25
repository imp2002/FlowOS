import React from 'react';
import { useMobile } from '../hooks/useMobile';

const PersonCard = ({ person, index }) => {
  const isMobile = useMobile();
  
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] ${
      isMobile ? 'p-4 mb-3' : 'p-6 mb-4'
    }`}>
      {/* 卡片头部 - 移动端优化 */}
      <div className={`flex items-start justify-between ${
        isMobile ? 'mb-3' : 'mb-4'
      }`}>
        <div className={`flex items-center ${
          isMobile ? 'space-x-2' : 'space-x-3'
        }`}>
          <div className={`bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold ${
            isMobile ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
          }`}>
            {person.name !== '未提供' ? person.name.charAt(0) : '?'}
          </div>
          <div>
            <h3 className={`font-semibold text-slate-800 ${
              isMobile ? 'text-base' : 'text-lg'
            }`}>
              {person.name !== '未提供' ? person.name : `搭子 ${index + 1}`}
            </h3>
            <div className={`flex flex-wrap gap-1 ${
              isMobile ? 'mt-1' : 'mt-1'
            }`}>
              {person.tag && person.tag.split(',').map((tag, tagIndex) => (
                <span 
                  key={tagIndex}
                  className={`bg-blue-100 text-blue-700 rounded-full font-medium ${
                    isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
                  }`}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 描述内容 - 移动端优化 */}
      <div className={isMobile ? 'mb-3' : 'mb-4'}>
        <h4 className={`font-medium text-slate-600 ${
          isMobile ? 'text-xs mb-1.5' : 'text-sm mb-2'
        }`}>描述</h4>
        <p className={`text-slate-700 leading-relaxed line-clamp-3 ${
          isMobile ? 'text-xs' : 'text-sm'
        }`}>
          {person.description !== '未提供' ? person.description : '暂无详细描述'}
        </p>
      </div>

      {/* 详细信息 - 移动端优化 */}
      <div className={`space-y-2 ${
        isMobile ? 'mb-3' : 'mb-4'
      }`}>
        {person.MBTI && person.MBTI !== '未提供' && (
          <div className={`flex items-center ${
            isMobile ? 'space-x-1.5' : 'space-x-2'
          }`}>
            <span className={`text-slate-500 ${
              isMobile ? 'text-xs w-10' : 'text-xs w-12'
            }`}>MBTI:</span>
            <span className={`font-medium text-slate-700 bg-purple-100 text-purple-700 rounded ${
              isMobile ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
            }`}>
              {person.MBTI}
            </span>
          </div>
        )}
        
        {person.contact && person.contact !== '未提供' && (
          <div className={`flex items-center ${
            isMobile ? 'space-x-1.5' : 'space-x-2'
          }`}>
            <span className={`text-slate-500 ${
              isMobile ? 'text-xs w-10' : 'text-xs w-12'
            }`}>联系:</span>
            <span className={`text-slate-700 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>{person.contact}</span>
          </div>
        )}
      </div>


    </div>
  );
};

export default PersonCard;