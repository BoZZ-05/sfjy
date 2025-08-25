// 应用主脚本
// 说明：本文件负责页面交互、弹窗、滚轴选择、公历/农历切换，以及数字八字计算调用。

(function() {
  // 缓存DOM元素
  const homePage = document.getElementById('homePage');
  const resultPage = document.getElementById('resultPage');
  const dateInput = document.getElementById('dateInput');
  const dateModal = document.getElementById('dateModal');
  const overlay = dateModal.querySelector('.modal-overlay');
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const solarBtn = document.getElementById('solarBtn');
  const lunarBtn = document.getElementById('lunarBtn');
  const yearPicker = document.getElementById('yearPicker');
  const monthPicker = document.getElementById('monthPicker');
  const dayPicker = document.getElementById('dayPicker');
  const hourPicker = document.getElementById('hourPicker');
  const minutePicker = document.getElementById('minutePicker');
  const backBtn = document.getElementById('backBtn');
  const birthInfo = document.getElementById('birthInfo');
  const upperGuaEl = document.getElementById('upperGua');
  const lowerGuaEl = document.getElementById('lowerGua');
  const analysisContent = document.getElementById('analysisContent');

  // 业务状态
  let isLunar = false; // 默认公历
  let state = {
    year: 2000,    // 默认年份改为2000
    month: 1,      // 默认月份改为01
    day: 1,        // 默认日期改为01
    hour: 12,      // 默认时间12:00
    minute: 0,
  };

  // 工具：生成范围数组
  function range(start, end) { // 包含端点
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  // 工具：创建滚轴项
  function createPickerItems(container, values, formatter = (v)=>v) {
    container.innerHTML = '';
    // 顶部占位
    for (let i=0; i<3; i++) {
      const ph = document.createElement('div');
      ph.className = 'picker-item';
      ph.style.visibility = 'hidden';
      container.appendChild(ph);
    }
    // 实际项
    values.forEach(v => {
      const item = document.createElement('div');
      item.className = 'picker-item';
      item.textContent = formatter(v);
      item.dataset.value = v;
      container.appendChild(item);
    });
    // 底部占位
    for (let i=0; i<3; i++) {
      const ph = document.createElement('div');
      ph.className = 'picker-item';
      ph.style.visibility = 'hidden';
      container.appendChild(ph);
    }
  }

  // 工具：获取月份显示格式化函数
  function getMonthFormatter() {
    if (isLunar) {
      // 农历月份：正月，二月，三月，四月，五月，六月，七月，八月，九月，十月，冬月，腊月
      const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
      return (v) => lunarMonths[v - 1] || `${v}月`;
    } else {
      // 公历月份：01月，02月...
      return (v) => `${String(v).padStart(2,'0')}月`;
    }
  }

  // 工具：获取日期显示格式化函数
  function getDayFormatter() {
    if (isLunar) {
      // 农历日期：初一到初十，十一到二十，廿一到廿九
      return (v) => {
        if (v <= 10) {
          const dayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十'];
          return dayNames[v - 1];
        } else if (v <= 20) {
          const dayNames = ['十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
          return dayNames[v - 11];
        } else {
          const dayNames = ['廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
          return dayNames[v - 21];
        }
      };
    } else {
      // 公历日期：01日，02日...
      return (v) => `${String(v).padStart(2,'0')}日`;
    }
  }

  // 工具：获取滚轮项像素高度（来自 CSS 变量 --wheel-item-height，含媒体查询适配）
  function getWheelItemPxHeight() {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--wheel-item-height');
    const num = parseFloat(val);
    return Number.isNaN(num) ? 40 : num; // 回退默认40
  }

  // 工具：设置选中项并应用3D效果
  function setActiveItem(wrapper, targetItem) {
    const list = wrapper.querySelector('.picker-list');
    const items = Array.from(list.querySelectorAll('.picker-item'));
    
    // 清除所有active状态
    items.forEach(it => it.classList.remove('active'));
    
    // 设置新的active项
    if (targetItem) {
      targetItem.classList.add('active');
      
      // 动态计算：将选中项的中心对齐到可视区域中心
      const targetIndex = items.indexOf(targetItem);
      const itemHeight = getWheelItemPxHeight();
      const listStyles = getComputedStyle(list);
      const paddingTop = parseFloat(listStyles.paddingTop) || 0;
      const wrapperCenter = wrapper.clientHeight / 2; // 可视区域中心Y
      const itemCenter = paddingTop + targetIndex * itemHeight + itemHeight / 2; // 目标项中心Y（相对list顶部）
      const translateY = wrapperCenter - itemCenter;
      
      // 应用变换，使目标项正好位于中心
      list.style.transform = `translateY(${translateY}px)`;
      
      // 更新所有项的3D效果
      updateWheelEffect(wrapper, targetIndex);
    }
  }
  
  // 工具：更新圆形滚轮的3D效果
  function updateWheelEffect(wrapper, centerIndex) {
    const items = Array.from(wrapper.querySelectorAll('.picker-item'));
    
    items.forEach((item, index) => {
      const distance = Math.abs(index - centerIndex);
      let opacity = 1;
      let rotateX = 0;
      let translateZ = 0;
      let scale = 1;
      
      if (distance === 0) {
        // 中心项
        opacity = 1;
        scale = 1.1;
      } else if (distance === 1) {
        opacity = 0.7;
        rotateX = 15;
        translateZ = -20;
      } else if (distance === 2) {
        opacity = 0.4;
        rotateX = 30;
        translateZ = -40;
      } else {
        opacity = 0.2;
        rotateX = 45;
        translateZ = -60;
      }
      
      item.style.opacity = opacity;
      item.style.transform = `rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`;
    });
  }

  // 已移除getSelectedValue函数，改为直接查询active元素

  // 根据年月，计算该月的最大天数（公历）
  function getMonthDays(year, month) {
    return new Date(year, month, 0).getDate();
  }

  // 初始化所有滚轮
  function initPickers() {
    createPickerItems(yearPicker, range(1900, 2099), v => `${v}年`);
    createPickerItems(monthPicker, range(1, 12), getMonthFormatter());
    createPickerItems(dayPicker, range(1, 31), getDayFormatter());
    createPickerItems(hourPicker, range(0, 23), v => `${String(v).padStart(2,'0')}时`);
    createPickerItems(minutePicker, range(0, 59), v => `${String(v).padStart(2,'0')}分`);

    // 延迟设置默认值，确保DOM完全更新
    setTimeout(() => {
      // 设定默认值高亮（2000-01-01 12:00）
      const defaultValues = [state.year, state.month, state.day, state.hour, state.minute];
      
      [yearPicker, monthPicker, dayPicker, hourPicker, minutePicker].forEach((list, idx) => {
        const wrapper = list.parentElement;
        const value = defaultValues[idx];
        const item = Array.from(list.children).find(el => el.dataset && Number(el.dataset.value) === value);
        if (item) {
          setActiveItem(wrapper, item);
        }
        
        // 绑定交互事件（点击、滚轮、拖拽、触摸）
        bindPickerInteractions(wrapper);
      });
    }, 50);
  }

  // 绑定滚轮交互事件（点击、鼠标滚轮、拖拽、触摸滑动）
  function bindPickerInteractions(wrapper) {
    // 避免重复绑定事件
    if (wrapper.dataset.bound === '1') return;
    wrapper.dataset.bound = '1';
    const items = wrapper.querySelectorAll('.picker-item');
    const isDatePicker = wrapper.dataset.type === 'day'; // 判断是否为日期滚轴
    
    // 点击事件
    items.forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.value) {
          setActiveItem(wrapper, item);
          // 如果是年份或月份变化，更新日期选项
          if (wrapper.dataset.type === 'year' || wrapper.dataset.type === 'month') {
            setTimeout(updateDayOptions, 100);
          }
        }
      });
    });

    // 鼠标滚轮事件（统一滚动速率与月份一致）
    wrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      scrollPicker(wrapper, direction);
    });

    // 拖拽事件（PC端）
    let isDragging = false;
    let startY = 0;
    let startTransform = 0;
    let hasMovedEnough = false; // 是否移动了足够距离
    const dragThreshold = isDatePicker ? 15 : 5; // 日期滚轴需要更大的拖拽阈值

    wrapper.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      hasMovedEnough = false;
      const list = wrapper.querySelector('.picker-list');
      const transform = list.style.transform.match(/translateY\(([^)]+)\)/);
      startTransform = transform ? parseFloat(transform[1]) : 0;
      wrapper.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      
      // 日期滚轴：需要拖拽超过阈值才开始移动
      if (isDatePicker && !hasMovedEnough) {
        if (Math.abs(deltaY) < dragThreshold) return;
        hasMovedEnough = true;
      }
      
      const list = wrapper.querySelector('.picker-list');
      list.style.transform = `translateY(${startTransform + deltaY}px)`;
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      hasMovedEnough = false;
      wrapper.style.cursor = 'grab';
      snapToClosest(wrapper);
    });

    // 触摸事件（移动端）
    let touchStartY = 0;
    let touchStartTransform = 0;
    let touchHasMovedEnough = false;
    let touchStartTime = 0;
    const touchThreshold = isDatePicker ? 20 : 8; // 日期滚轴需要更大的触摸阈值
    const longPressTime = isDatePicker ? 200 : 0; // 日期滚轴需要长按一会儿才能滑动

    wrapper.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchHasMovedEnough = false;
      const list = wrapper.querySelector('.picker-list');
      const transform = list.style.transform.match(/translateY\(([^)]+)\)/);
      touchStartTransform = transform ? parseFloat(transform[1]) : 0;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - touchStartY;
      const touchDuration = Date.now() - touchStartTime;
      
      // 日期滚轴：需要长按一定时间且移动超过阈值才开始滑动
      if (isDatePicker) {
        if (touchDuration < longPressTime) return; // 还没长按够时间
        if (!touchHasMovedEnough && Math.abs(deltaY) < touchThreshold) return;
        touchHasMovedEnough = true;
      }
      
      const list = wrapper.querySelector('.picker-list');
      list.style.transform = `translateY(${touchStartTransform + deltaY}px)`;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
      touchHasMovedEnough = false;
      snapToClosest(wrapper);
    });
  }

  // 滚轮滚动函数
  function scrollPicker(wrapper, direction) {
    const activeItem = wrapper.querySelector('.picker-item.active');
    if (!activeItem) return;

    const items = Array.from(wrapper.querySelectorAll('.picker-item'));
    const currentIndex = items.indexOf(activeItem);
    const newIndex = Math.max(0, Math.min(items.length - 1, currentIndex + direction));
    
    if (newIndex !== currentIndex && items[newIndex].dataset.value) {
      setActiveItem(wrapper, items[newIndex]);
      // 如果是年份或月份变化，更新日期选项
      if (wrapper.dataset.type === 'year' || wrapper.dataset.type === 'month') {
        setTimeout(updateDayOptions, 100);
      }
    }
  }

  // 拖拽/滑动结束后，自动吸附到最近的项（提高灵敏度）
  function snapToClosest(wrapper) {
    const list = wrapper.querySelector('.picker-list');
    const items = Array.from(wrapper.querySelectorAll('.picker-item'));
    const itemHeight = getWheelItemPxHeight();
    const listStyles = getComputedStyle(list);
    const paddingTop = parseFloat(listStyles.paddingTop) || 0;
    const wrapperCenter = wrapper.clientHeight / 2;
    
    // 计算当前transform值
    const transform = list.style.transform.match(/translateY\(([^)]+)\)/);
    const currentTranslateY = transform ? parseFloat(transform[1]) : 0;
    
    // 找到最接近中心的项（提高灵敏度：减小阈值）
    let closestItem = null;
    let minDistance = Infinity;
    
    items.forEach((item, index) => {
      if (!item.dataset.value) return; // 忽略占位项
      
      const itemCenter = paddingTop + index * itemHeight + itemHeight / 2;
      const itemScreenY = itemCenter + currentTranslateY;
      const distance = Math.abs(itemScreenY - wrapperCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
      }
    });
    
    // 提高吸附灵敏度：只要距离小于半个项高度就吸附
    const snapThreshold = itemHeight * 0.3; // 降低阈值，提高灵敏度
    if (closestItem && minDistance <= snapThreshold * 2) {
      setActiveItem(wrapper, closestItem);
      // 如果是年份或月份变化，更新日期选项
      if (wrapper.dataset.type === 'year' || wrapper.dataset.type === 'month') {
        setTimeout(updateDayOptions, 100);
      }
    }
  }

  // 转换当前选中的日期（公历<->农历）
  function convertCurrentDate(wasLunar, isNowLunar) {
    try {
      // 获取当前选中的日期
      const yearActive = yearPicker.querySelector('.active');
      const monthActive = monthPicker.querySelector('.active');
      const dayActive = dayPicker.querySelector('.active');
      
      if (!yearActive || !monthActive || !dayActive) return;
      
      const currentYear = Number(yearActive.dataset.value);
      const currentMonth = Number(monthActive.dataset.value);
      const currentDay = Number(dayActive.dataset.value);
      
      const calc = new window.DigitalBaziCalculator();
      let convertedDate;
      
      if (wasLunar && !isNowLunar) {
        // 从农历转换到公历
        convertedDate = calc.lunarToSolar(currentYear, currentMonth, currentDay);
      } else if (!wasLunar && isNowLunar) {
        // 从公历转换到农历
        convertedDate = calc.solarToLunar(currentYear, currentMonth, currentDay);
      } else {
        return; // 没有变化，不需要转换
      }
      
      if (convertedDate && convertedDate.year && convertedDate.month && convertedDate.day) {
        // 更新选中的年月日
        setTimeout(() => {
          // 更新年份
          const newYearItem = yearPicker.querySelector(`[data-value="${convertedDate.year}"]`);
          if (newYearItem) {
            setActiveItem(yearPicker.parentElement, newYearItem);
          }
          
          // 更新月份
          const newMonthItem = monthPicker.querySelector(`[data-value="${convertedDate.month}"]`);
          if (newMonthItem) {
            setActiveItem(monthPicker.parentElement, newMonthItem);
          }
          
          // 延迟更新日期，确保月份更新完成
          setTimeout(() => {
            const newDayItem = dayPicker.querySelector(`[data-value="${convertedDate.day}"]`);
            if (newDayItem) {
              setActiveItem(dayPicker.parentElement, newDayItem);
            }
          }, 150);
        }, 100);
      }
    } catch (error) {
      console.warn('日期转换失败:', error);
    }
  }
  
  // 更新天数（当年或月变化时，或农历/公历切换时）
  function updateDayOptions() {
    const yearActive = yearPicker.querySelector('.active');
    const monthActive = monthPicker.querySelector('.active');
    const y = yearActive ? Number(yearActive.dataset.value) : state.year;
    const m = monthActive ? Number(monthActive.dataset.value) : state.month;

    // 记录当前选中的日与当前滚轴位置
    const prevActive = dayPicker.querySelector('.active');
    const prevDay = prevActive ? Number(prevActive.dataset.value) : state.day;
    const prevTransform = dayPicker.style.transform;

    // 公历按真实天数，农历按需求固定到30天
    const solarDays = getMonthDays(y, m);
    const maxDay = isLunar ? 30 : solarDays;
    
    // 重新生成日列表（不改变当前 transform）
    createPickerItems(dayPicker, range(1, maxDay), getDayFormatter());

    // 重新绑定（带去重，不会重复）
    bindPickerInteractions(dayPicker.parentElement);

    // 如果原来的日仍然有效：保持当前视觉位置，不触发展示位移
    if (prevDay && prevDay <= maxDay) {
      const keepItem = dayPicker.querySelector(`[data-value="${prevDay}"]`);
      if (keepItem) {
        keepItem.classList.add('active');
        // 保留原 transform，避免“日轴也跟着转”的观感
        if (prevTransform) dayPicker.style.transform = prevTransform;
        // 同步3D效果（以当前active为中心）
        const items = Array.from(dayPicker.querySelectorAll('.picker-item'));
        const centerIndex = items.indexOf(keepItem);
        updateWheelEffect(dayPicker.parentElement, centerIndex);
        return;
      }
    }

    // 否则：选中新的合法日期并居中（只在必要时才会看到位移）
    const targetDay = Math.min(prevDay || 1, maxDay);
    const targetItem = dayPicker.querySelector(`[data-value="${targetDay}"]`);
    if (targetItem) setActiveItem(dayPicker.parentElement, targetItem);
  }

  // 更新月份选项（农历/公历切换时）
  function updateMonthOptions() {
    // 记录当前选中的月与当前滚轴位置
    const prevActive = monthPicker.querySelector('.active');
    const prevMonth = prevActive ? Number(prevActive.dataset.value) : state.month;
    const prevTransform = monthPicker.style.transform;

    // 重新生成月列表（仅变更显示格式，不改变值）
    createPickerItems(monthPicker, range(1, 12), getMonthFormatter());

    // 重新绑定（带去重，不会重复）
    bindPickerInteractions(monthPicker.parentElement);

    // 优先保持当前active的月份与视觉位置，避免“跳初始月份”
    const keepItem = monthPicker.querySelector(`[data-value="${prevMonth}"]`);
    if (keepItem) {
      keepItem.classList.add('active');
      if (prevTransform) monthPicker.style.transform = prevTransform; // 保留原位置
      const items = Array.from(monthPicker.querySelectorAll('.picker-item'));
      const centerIndex = items.indexOf(keepItem);
      updateWheelEffect(monthPicker.parentElement, centerIndex);
      return;
    }

    // 回退：找不到对应项时，按state.month对齐
    const fallbackItem = monthPicker.querySelector(`[data-value="${state.month}"]`);
    if (fallbackItem) {
      setActiveItem(monthPicker.parentElement, fallbackItem);
    }
  }

  // 初始化所有滚轮
  function initPickers() {
    createPickerItems(yearPicker, range(1900, 2099), v => `${v}年`);
    createPickerItems(monthPicker, range(1, 12), getMonthFormatter());
    createPickerItems(dayPicker, range(1, 31), getDayFormatter());
    createPickerItems(hourPicker, range(0, 23), v => `${String(v).padStart(2,'0')}时`);
    createPickerItems(minutePicker, range(0, 59), v => `${String(v).padStart(2,'0')}分`);

    // 延迟设置默认值，确保DOM完全更新
    setTimeout(() => {
      // 设定默认值高亮（2000-01-01 12:00）
      const defaultValues = [state.year, state.month, state.day, state.hour, state.minute];
      
      [yearPicker, monthPicker, dayPicker, hourPicker, minutePicker].forEach((list, idx) => {
        const wrapper = list.parentElement;
        const value = defaultValues[idx];
        const item = Array.from(list.children).find(el => el.dataset && Number(el.dataset.value) === value);
        if (item) {
          setActiveItem(wrapper, item);
        }
        
        // 绑定交互事件（点击、滚轮、拖拽、触摸）
        bindPickerInteractions(wrapper);
      });
    }, 50);
  }

  // 打开弹窗
  function openModal() {
    dateModal.classList.add('show');
    // 在弹窗显示后，重新对齐各滚轴的当前选中项（解决初始化时高度为0导致未居中）
    setTimeout(() => {
      [yearPicker, monthPicker, dayPicker, hourPicker, minutePicker].forEach(list => {
        const wrapper = list.parentElement;
        const active = list.querySelector('.picker-item.active');
        if (active) {
          setActiveItem(wrapper, active);
        } else {
          // 若没有active，回退到state中的默认/当前值
          const type = wrapper.dataset.type;
          let value = null;
          if (type === 'year') value = state.year;
          else if (type === 'month') value = state.month;
          else if (type === 'day') value = state.day;
          else if (type === 'hour') value = state.hour;
          else if (type === 'minute') value = state.minute;
          if (value != null) {
            const el = list.querySelector(`[data-value="${value}"]`);
            if (el) setActiveItem(wrapper, el);
          }
        }
      });
    }, 60);
  }
  // 关闭弹窗
  function closeModal() {
    dateModal.classList.remove('show');
  }

  // 设置公历/农历开关
  function setCalendarType(lunar) {
    const wasLunar = isLunar;
    isLunar = lunar;
    solarBtn.classList.toggle('active', !lunar);
    lunarBtn.classList.toggle('active', lunar);
    
    // 如果历法发生了变化，进行日期转换
    if (wasLunar !== lunar) {
      convertCurrentDate(wasLunar, lunar);
    }
    
    // 切换历法时，自动更新月份和日期的显示格式
    updateMonthOptions();
    setTimeout(updateDayOptions, 100); // 延迟更新日期，确保月份更新完成
  }

  // 事件绑定
  function bindEvents() {
    // 点击输入框打开弹窗
    dateInput.addEventListener('click', openModal);
    // 点击蒙版或取消按钮关闭
    overlay.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // 切换公历/农历
    solarBtn.addEventListener('click', () => setCalendarType(false));
    lunarBtn.addEventListener('click', () => setCalendarType(true));

    // 年/月点击后更新日期选项（已在bindPickerClick中处理）

    // 完成按钮：读取选中的值，计算并展示结果
    confirmBtn.addEventListener('click', () => {
      // 从各个滚轮读取当前选中的值（active项）
      const yearActive = yearPicker.querySelector('.active');
      const monthActive = monthPicker.querySelector('.active');
      const dayActive = dayPicker.querySelector('.active');
      const hourActive = hourPicker.querySelector('.active');
      const minuteActive = minutePicker.querySelector('.active');
      
      if (yearActive && monthActive && dayActive && hourActive && minuteActive) {
        state.year = Number(yearActive.dataset.value);
        state.month = Number(monthActive.dataset.value);
        state.day = Number(dayActive.dataset.value);
        state.hour = Number(hourActive.dataset.value);
        state.minute = Number(minuteActive.dataset.value);
        
        // 组装hour为浮点数（如 1点10分 -> 1.10）
        const hourFloat = (state.hour == null || state.minute == null) ? 0.7 : (state.hour + state.minute/100);

        // 调用计算器
        const calc = new window.DigitalBaziCalculator();
        const { upperGua, lowerGua, solarDate, lunarDate, birthTime } = calc.calculateBazi(state.year, state.month, state.day, hourFloat, isLunar);

        // 写回输入框展示简单日期
        dateInput.value = `${isLunar ? '农历' : '公历'} ${state.year}-${String(state.month).padStart(2,'0')}-${String(state.day).padStart(2,'0')} ${String(state.hour).padStart(2,'0')}:${String(state.minute).padStart(2,'0')}`;

        // 关闭弹窗
        closeModal();

        // 填充结果页
        birthInfo.innerHTML = `
          <div>阳历：${solarDate}</div>
          <div>阴历：${lunarDate}</div>
          <div>${calc.formatBirthTime(hourFloat)}</div>
        `;

        upperGuaEl.textContent = upperGua.map(x => x==null? 'null' : x).join(' - ');
        lowerGuaEl.textContent = lowerGua.map(x => x==null? 'null' : x).join(' - ');

        // 渲染数字与五行对应（合并“映射 + 出现次数”到同一行）
        if (analysisContent) {
          const wuxingGroups = [
            ["土", [3, 9, 8]],
            ["木", [4, 5]],
            ["金", [10, 11]],
            ["水", [1, 2, 12]],
            ["火", [6, 7]]
          ];

          const upperNumbers = upperGua.filter(n => n !== null);
          const lowerNumbers = lowerGua.filter(n => n !== null);

          const rows = wuxingGroups.map(([wuxing, numbers]) => {
            const found = [
              ...upperNumbers.filter(num => numbers.includes(num)),
              ...lowerNumbers.filter(num => numbers.includes(num))
            ];
            const total = found.length;
            const mapStr = numbers.join('，');
            return `<div class="row"><div class="map">${wuxing}：${mapStr}</div><div class="stats">出现<span class="count">${total}</span>次</div></div>`;
          }).join('');

          analysisContent.innerHTML = `<div class="wuxing-combined">${rows}</div>`;
        }

        // 切换页面
        homePage.classList.remove('active');
        resultPage.classList.add('active');
      }
    });

    // 返回按钮
    backBtn.addEventListener('click', () => {
      resultPage.classList.remove('active');
      homePage.classList.add('active');
    });
  }

  // 初始化
  function init() {
    initPickers();
    bindEvents();
    setCalendarType(false); // 默认公历
  }

  document.addEventListener('DOMContentLoaded', init);
})();
