import React, { useState, useRef, useEffect } from 'react';
import { useMobile } from '../hooks/usemobile.js';

const PersonCard = ({ person, index, onToggleSelect, isSelected }) => {
  const isMobile = useMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const descriptionRef = useRef(null);
  
  // 切换展开状态
  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // 检查描述是否需要展开按钮
  useEffect(() => {
    const checkTextOverflow = () => {
      if (descriptionRef.current && person.description && person.description !== '未提供') {
        const element = descriptionRef.current;
        // 临时移除line-clamp样式来获取真实高度
        element.style.webkitLineClamp = 'unset';
        element.style.display = 'block';
        const fullHeight = element.scrollHeight;
        
        // 恢复line-clamp样式
        element.style.webkitLineClamp = '';
        element.style.display = '';
        
        // 获取限制高度
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseInt(computedStyle.lineHeight) || 20;
        const maxLines = window.innerWidth <= 640 ? 2 : 3; // 移动端2行，桌面端3行
        const maxHeight = lineHeight * maxLines;
        
        setShowExpandButton(fullHeight > maxHeight + 5); // 添加5px容差
      } else {
        setShowExpandButton(false);
      }
    };

    // 延迟检查，确保DOM已渲染
    const timer = setTimeout(checkTextOverflow, 100);
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkTextOverflow);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTextOverflow);
    };
  }, [person.description]);
  
  // 处理选择切换
  const handleToggleSelect = (e) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(person.id || index);
    }
  };
  
  // 获取头像显示文本
  const getAvatarText = () => {
    if (person.name && person.name !== '未提供') {
      return person.name.charAt(0);
    }
    return (index + 1).toString();
  };
  
  // 格式化兴趣爱好
  const getInterests = () => {
    if (person.interests && Array.isArray(person.interests)) {
      return person.interests;
    }
    if (person.tag && person.tag !== '未提供') {
      return person.tag.split(',').map(tag => tag.trim());
    }
    return [];
  };
  
  return (
    <>
      <div 
        className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
          isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-100'
        }`}

      >
        {/* 选择按钮 */}
        {onToggleSelect && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleToggleSelect}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-purple-500 border-purple-500 text-white' 
                  : 'bg-white border-slate-300 hover:border-purple-400'
              }`}
            >
              {isSelected && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        )}
        
        {/* 头像和基本信息区域 */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 px-6 py-6 relative">
          <div className="flex items-center space-x-4">
            {/* 头像 */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {getAvatarText()}
              </div>
              {/* 在线状态指示器 */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            
            {/* 姓名和基本信息 */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {person.name && person.name !== '未提供' ? person.name : `搭子 ${index + 1}`}
              </h3>
              
              {/* 年龄和大学信息 */}
              <div className="text-sm text-slate-600 mb-2">
                {person.age && <span>{person.age}岁</span>}
                {person.age && person.university && person.university !== '未提供' && <span> • </span>}
                {person.university && person.university !== '未提供' && <span>{person.university}</span>}
              </div>
              
              {/* 专业信息 */}
              {person.major && person.major !== '未提供' && (
                <div className="text-sm text-slate-600 mb-2">
                  {person.major}
                </div>
              )}
              
              {/* 标签区域 */}
              <div className="flex flex-wrap gap-2">
                {(isExpanded ? getInterests() : getInterests().slice(0, 3)).map((interest, tagIndex) => (
                  <span 
                    key={tagIndex}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                  >
                    {interest}
                  </span>
                ))}
                {getInterests().length > 3 && (
                  <button
                    onClick={handleToggleExpand}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-slate-100 rounded-full transition-all duration-200 flex items-center space-x-1"
                  >
                    {isExpanded ? (
                      <>
                        <span>收起</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>展开全部</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 详细信息区域 */}
        <div className="px-6 py-5 space-y-4">
          {/* 个人描述 */}
          <div>
            <p 
              ref={descriptionRef}
              className={`text-slate-700 leading-relaxed text-sm transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}
              style={{
                maxHeight: isExpanded ? 'none' : undefined,
                overflow: isExpanded ? 'visible' : 'hidden'
              }}
            >
              {person.description && person.description !== '未提供' ? person.description : '暂无详细描述'}
            </p>
            {showExpandButton && (
              <button
                onClick={handleToggleExpand}
                className="text-blue-500 hover:text-blue-600 text-sm mt-2 flex items-center space-x-1 transition-colors duration-200"
              >
                {isExpanded ? (
                  <>
                    <span>收起</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>展开全部</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 性格特征 */}
          {person.personality && person.personality !== '未提供' && (
            <div>
              <span className="text-slate-500 text-sm font-medium block mb-2">性格特征:</span>
              <p className="text-slate-700 text-sm leading-relaxed">
                {person.personality}
              </p>
            </div>
          )}

          {/* MBTI信息 */}
          {person.MBTI && person.MBTI !== '未提供' && (
            <div className="flex items-center space-x-3">
              <span className="text-slate-500 text-sm font-medium min-w-[50px]">MBTI:</span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                {person.MBTI}
              </span>
            </div>
          )}
          
          {/* 联系方式 */}
          {person.contact && person.contact !== '未提供' && (
            <div className="flex items-center space-x-3">
              <span className="text-slate-500 text-sm font-medium min-w-[50px]">联系:</span>
              <span className="text-slate-700 text-sm bg-slate-50 px-3 py-1.5 rounded-lg">
                {person.contact}
              </span>
            </div>
          )}
        </div>

        {/* 删除底部操作区域 */}
      </div>


    </>
  );
};

export default PersonCard;