// 上海大学教务系统自动抢课脚本
// 中欧 信息工程 ceilf
// https://github.com/ceilf6
// https://blog.csdn.net/2301_78856868
// 3506456886@qq.com

// 使用方法:
// 1. 登录教务系统并进入选课页面
// 2. 选择目标课称号并填入下面的 TARGET_COURSE_CODE
// 3. 按F12打开控制台，粘贴此脚本并执行
// 4. 输入 courseGrabber.start() 开始抢课

(function() {
    'use strict';
    
    // 配置参数常数
    const TARGET_COURSE_CODE = '';  // 填入目标课程号

    const CHECK_INTERVAL = 2000;            // 检查间隔
    const MAX_ATTEMPTS = 1000;              // 最大尝试次数
    const MAX_FAILED_ATTEMPTS = 5;          // 最大连续失败次数
    const RETRY_DELAY = 3000;               // 重试延迟(毫秒)

    let attemptCount = 0;
    let failedAttempts = 0;                 // 连续失败次数计数器
    let isRunning = false;
    let intervalId = null;
    let triedTeachingClasses = new Set();   // 记录已尝试的教学班
    let conflictedClasses = new Set();      // 记录时间冲突的教学班
    let isSelecting = false;                // 标记当前是否正在选课操作中
    
    // 彩色日志函数
    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[抢课脚本 ${timestamp}]`;
        
        switch(type) {
            case 'success':
                console.log(`%c${prefix} ✅ ${message}`, 'color: #00ff00; font-weight: bold;');
                break;
            case 'error':
                console.log(`%c${prefix} ❌ ${message}`, 'color: #ff0000; font-weight: bold;');
                break;
            case 'warning':
                console.log(`%c${prefix} ⚠️ ${message}`, 'color: #ffa500; font-weight: bold;');
                break;
            case 'info':
                console.log(`%c${prefix} ℹ️ ${message}`, 'color: #0099ff;');
                break;
        }
    }
    
    // 查找目标课程的所有教学班
    function findAllTeachingClasses() {
        const teachingClasses = [];
        
        // 查找包含目标课程号的所有行
        const allElements = document.querySelectorAll('*');
        let courseSection = null;
        
        // 首先找到课程主行
        for (let element of allElements) {
            const text = element.textContent || '';
            if (text.includes(`(${TARGET_COURSE_CODE})`) || text.includes(TARGET_COURSE_CODE)) {
                courseSection = element.closest('div, section, table');
                break;
            }
        }
        
        if (!courseSection) {
            // 如果没找到课程区域，尝试表格行方式
            const courseRows = document.querySelectorAll('table tbody tr');
            for (let row of courseRows) {
                const cells = row.querySelectorAll('td');
                for (let cell of cells) {
                    if (cell.textContent.trim() === TARGET_COURSE_CODE) {
                        // 找到课程号后，查找同一表格中的所有教学班
                        const table = row.closest('table');
                        if (table) {
                            const allRows = table.querySelectorAll('tbody tr');
                            for (let classRow of allRows) {
                                const selectButton = classRow.querySelector('button, a, input[type="button"]');
                                if (selectButton) {
                                    const classInfo = extractTeachingClassInfo(classRow);
                                    if (classInfo && classInfo.id) {
                                        teachingClasses.push({
                                            row: classRow,
                                            info: classInfo,
                                            button: selectButton
                                        });
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        } else {
            // 在课程区域内查找所有教学班行
            const classRows = courseSection.querySelectorAll('tr');
            for (let row of classRows) {
                const selectButton = row.querySelector('button, a, input[type="button"]');
                if (selectButton) {
                    const classInfo = extractTeachingClassInfo(row);
                    if (classInfo && classInfo.id) {
                        teachingClasses.push({
                            row: row,
                            info: classInfo,
                            button: selectButton
                        });
                    }
                }
            }
        }
        
        log(`找到 ${teachingClasses.length} 个教学班`);
        return teachingClasses;
    }
    
    // 提取教学班信息
    function extractTeachingClassInfo(row) {
        try {
            const cells = row.querySelectorAll('td');
            let className = '';
            let teacher = '';
            let capacity = '';
            let timeInfo = '';
            
            // 记录原始文本用于调试
            const fullText = row.textContent || row.innerText || '';
            
            for (let cell of cells) {
                const text = cell.textContent.trim();
                
                // 提取教学班名称（如：工程化学-0001）
                if (text.includes('-') && text.match(/\d{4}/)) {
                    className = text;
                }
                
                // 提取教师信息
                if (text.includes('【') && text.includes('】')) {
                    teacher = text;
                }
                
                // 提取容量信息 - 只选择数字/数字格式
                if (text.match(/\d+\/\d+/)) {
                    // 只保留数字格式的容量信息
                    if (!capacity || !capacity.match(/\d+\/\d+/)) {
                        capacity = text;
                    }
                }
                
                // 提取时间信息
                if (text.includes('星期') || text.includes('第') || text.includes('节')) {
                    timeInfo = text;
                }
            }
            
            // 如果没有找到基本信息，尝试从整个行文本中提取
            if (!className || !teacher || !capacity) {
                // 尝试提取教学班名称
                const classMatch = fullText.match(/([^-\s]+[-]\d{4})/);
                if (classMatch) {
                    className = classMatch[1];
                }
                
                // 尝试提取教师
                const teacherMatch = fullText.match(/【([^】]+)】/);
                if (teacherMatch) {
                    teacher = `【${teacherMatch[1]}】`;
                }
                
                // 尝试提取容量
                const capacityMatch = fullText.match(/(\d+\/\d+|已满)/);
                if (capacityMatch) {
                    capacity = capacityMatch[1];
                }
                
                // 尝试提取时间
                const timeMatch = fullText.match(/(星期[一二三四五六日][^星期]*)/g);
                if (timeMatch) {
                    timeInfo = timeMatch.join(' ');
                }
            }
            
            // 更宽松的信息检查 - 只要有按钮就认为是有效的教学班
            const hasButton = row.querySelector('button, a, input[type="button"]') !== null;
            
            // 生成唯一ID
            const uniqueId = className || teacher || capacity || fullText.substring(0, 20) || `row_${Date.now()}_${Math.random()}`;
            
            const result = {
                className: className || '未知教学班',
                teacher: teacher || '未知教师', 
                capacity: capacity || '未知容量',
                timeInfo: timeInfo || '未知时间',
                id: `${uniqueId}_${teacher || 'unknown'}`,
                hasButton: hasButton,
                rawText: fullText.substring(0, 200) // 保留原始文本用于调试
            };
            
            return result;
            
        } catch (error) {
            // 返回默认信息而不是null
            return {
                className: '解析失败',
                teacher: '未知教师',
                capacity: '未知容量',
                timeInfo: '未知时间',
                id: `error_${Date.now()}_${Math.random()}`,
                hasButton: false,
                rawText: (row.textContent || '').substring(0, 200)
            };
        }
    }
    
    // 检查教学班是否有余量
    function checkTeachingClassCapacity(teachingClass) {
        try {
            // 确保teachingClass和info存在
            if (!teachingClass || !teachingClass.info) {
                return false;
            }
            
            const capacity = teachingClass.info.capacity;
            
            // 在同一行中查找所有容量信息
            const rowText = teachingClass.row ? teachingClass.row.textContent : '';
            const allCapacityMatches = rowText.match(/\d+\/\d+/g) || [];
            
            // 优先检查标准格式 "当前人数/最大容量" (如: 125/127)
            let match = capacity.match(/^(\d+)\/(\d+)$/);
            if (match) {
                const current = parseInt(match[1]);
                const max = parseInt(match[2]);
                return current < max;
            }
            
            // 如果当前容量信息不是标准格式，在所有容量信息中查找标准格式
            for (let capacityInfo of allCapacityMatches) {
                match = capacityInfo.match(/^(\d+)\/(\d+)$/);
                if (match) {
                    const current = parseInt(match[1]);
                    const max = parseInt(match[2]);
                    // 排除明显不合理的数据（如 0/0）
                    if (max > 0 && max < 1000) {
                        return current < max;
                    }
                }
            }
            
            // 格式: "135/0/0" - 只取第一个数字作为容量上限
            match = capacity.match(/^(\d+)\/\d+\/\d+$/);
            if (match) {
                const maxCapacity = parseInt(match[1]);
                
                // 在其他容量信息中查找真正的已选人数
                for (let capacityInfo of allCapacityMatches) {
                    const currentMatch = capacityInfo.match(/^(\d+)\/(\d+)$/);
                    if (currentMatch) {
                        const currentCount = parseInt(currentMatch[1]);
                        const actualCapacity = parseInt(currentMatch[2]);
                        if (actualCapacity === maxCapacity) {
                            return currentCount < maxCapacity;
                        }
                    }
                }
                
                // 如果找不到匹配的，继续查找其他可能的人数/容量组合
                for (let capacityInfo of allCapacityMatches) {
                    const currentMatch = capacityInfo.match(/^(\d+)\/(\d+)$/);
                    if (currentMatch) {
                        const currentCount = parseInt(currentMatch[1]);
                        const actualCapacity = parseInt(currentMatch[2]);
                        return currentCount < actualCapacity;
                    }
                }
                
                // 如果完全没有找到人数/容量信息，则无法判断
                return false;
            }
            
            // 格式: 单独的数字 - 无法判断，需要其他容量信息
            match = capacity.match(/^(\d+)$/);
            if (match) {
                // 在其他容量信息中查找人数/容量对比
                for (let capacityInfo of allCapacityMatches) {
                    const currentMatch = capacityInfo.match(/^(\d+)\/(\d+)$/);
                    if (currentMatch) {
                        const currentCount = parseInt(currentMatch[1]);
                        const actualCapacity = parseInt(currentMatch[2]);
                        return currentCount < actualCapacity;
                    }
                }
                
                return false;
            }
            
            // 如果容量信息无法解析，尝试在行中查找任何人数/容量信息
            if (allCapacityMatches.length > 0) {
                for (let capacityInfo of allCapacityMatches) {
                    const currentMatch = capacityInfo.match(/^(\d+)\/(\d+)$/);
                    if (currentMatch) {
                        const currentCount = parseInt(currentMatch[1]);
                        const actualCapacity = parseInt(currentMatch[2]);
                        if (actualCapacity > 0 && actualCapacity < 1000) {
                            return currentCount < actualCapacity;
                        }
                    }
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
    
    // 检查是否出现时间冲突警告
    function checkTimeConflictWarning() {
        try {
            // 检查页面中是否出现时间冲突警告
            const warningTexts = [
                '所选教学班的上课时间与其他教学班有冲突',
                '上课时间与其他教学班有冲突',
                '时间冲突',
                '时间有冲突'
            ];
            
            // 查找所有可能包含警告文本的元素
            const allElements = document.querySelectorAll('*');
            for (let element of allElements) {
                const text = element.textContent || element.innerText || '';
                for (let warningText of warningTexts) {
                    if (text.includes(warningText)) {
                        return true;
                    }
                }
            }
            
            // 检查弹窗或模态框中的警告
            const modals = document.querySelectorAll('.modal, .dialog, .alert, [role="dialog"], [role="alert"]');
            for (let modal of modals) {
                const modalText = modal.textContent || modal.innerText || '';
                for (let warningText of warningTexts) {
                    if (modalText.includes(warningText)) {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    // 尝试选择教学班
    function selectTeachingClass(teachingClass) {
        if (!teachingClass || !teachingClass.row) return false;
        
        const classId = teachingClass.info.id;
        
        // 检查是否已经因时间冲突被跳过
        if (conflictedClasses.has(classId)) {
            log(`教学班 ${teachingClass.info.className} 已知时间冲突，跳过`, 'warning');
            return false;
        }
        
        try {
            log(`尝试选择教学班: ${teachingClass.info.className} (${teachingClass.info.teacher})`, 'info');
            log(`时间: ${teachingClass.info.timeInfo}`);
            log(`容量: ${teachingClass.info.capacity}`);
            
            // 标记正在选课
            isSelecting = true;
            
            // 查找该行中真正的选课按钮或链接
            const row = teachingClass.row;
            const rowText = row.textContent || '';
            
            // 查找包含"选课"文本的元素 - 更精确的查找逻辑
            let selectElement = null;
            const allElements = row.querySelectorAll('*');
            
            // 优先级1: 查找明确的"选课"文本
            for (let element of allElements) {
                const elementText = element.textContent.trim();
                if (elementText === '选课') {
                    // 确保不是退选按钮，且是可点击的
                    if (!elementText.includes('退选') && (element.tagName === 'BUTTON' || element.tagName === 'A' || element.onclick || element.getAttribute('onclick'))) {
                        selectElement = element;
                        break;
                    }
                }
            }
            
            // 优先级2: 查找包含"选课"的可点击元素
            if (!selectElement) {
                for (let element of allElements) {
                    const elementText = element.textContent.trim();
                    if (elementText.includes('选课') && !elementText.includes('退选')) {
                        if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.onclick || element.getAttribute('onclick')) {
                            selectElement = element;
                            break;
                        }
                    }
                }
            }
            
            // 优先级3: 查找可点击的按钮或链接（但要排除明确的退选或其他功能）
            if (!selectElement) {
                const clickableElements = row.querySelectorAll('button, a, input[type="button"], [onclick]');
                for (let element of clickableElements) {
                    const elementText = element.textContent.trim();
                    // 只有在排除了明确的其他功能按钮后才选择
                    if (!elementText.includes('退选') && 
                        !elementText.includes('详情') && 
                        !elementText.includes('查看') &&
                        !elementText.includes('取消') &&
                        !elementText.includes('关闭') &&
                        elementText.length > 0 &&
                        (element.tagName === 'BUTTON' || element.tagName === 'A' || element.onclick || element.getAttribute('onclick'))) {
                        selectElement = element;
                        break;
                    }
                }
            }
            
            if (selectElement) {
                log('找到选课元素，正在点击...', 'info');
                
                // 记录已尝试的教学班
                triedTeachingClasses.add(classId);
                
                // 点击选课元素
                selectElement.click();
                
                // 等待并检查结果
                setTimeout(() => {
                    // 首先检查是否有时间冲突警告
                    if (checkTimeConflictWarning()) {
                        log(`🛑 教学班 ${teachingClass.info.className} 时间冲突！`, 'error');
                        
                        // 记录冲突的教学班
                        conflictedClasses.add(classId);
                        
                        // 尝试关闭警告弹窗
                        const cancelButtons = document.querySelectorAll('button, input[type="button"], a');
                        for (let btn of cancelButtons) {
                            const text = btn.textContent.trim();
                            if (text.includes('取消') || text.includes('关闭') || text.includes('确定')) {
                                btn.click();
                                log('已关闭时间冲突警告弹窗', 'info');
                                break;
                            }
                        }
                        
                        log(`继续尝试其他教学班...`, 'info');
                        isSelecting = false;
                        return;
                    }
                    
                    // 如果没有时间冲突，查找并点击确认按钮
                    const confirmButtons = document.querySelectorAll('button, input[type="button"], a');
                    for (let btn of confirmButtons) {
                        const text = btn.textContent.trim();
                        if (text.includes('确定') || text.includes('确认') || text.includes('提交') || text.includes('OK')) {
                            btn.click();
                            log('已点击确认按钮', 'info');
                            
                            // 点击确认后再次检查是否出现时间冲突警告
                            setTimeout(() => {
                                if (checkTimeConflictWarning()) {
                                    log(`🛑 确认后检测到时间冲突: ${teachingClass.info.className}`, 'error');
                                    conflictedClasses.add(classId);
                                    
                                    // 关闭冲突警告
                                    const closeButtons = document.querySelectorAll('button, input[type="button"], a');
                                    for (let closeBtn of closeButtons) {
                                        const closeText = closeBtn.textContent.trim();
                                        if (closeText.includes('确定') || closeText.includes('取消') || closeText.includes('关闭')) {
                                            closeBtn.click();
                                            break;
                                        }
                                    }
                                    isSelecting = false;
                                } else {
                                    // 等待更长时间再验证是否真正选课成功
                                    setTimeout(() => {
                                        // 重新查找教学班，验证是否真的选上了
                                        const updatedClasses = findAllTeachingClasses();
                                        let reallySelected = false;
                                        
                                        for (let updatedClass of updatedClasses) {
                                            if (updatedClass.info.className === teachingClass.info.className) {
                                                const updatedRowText = updatedClass.row ? updatedClass.row.textContent : '';
                                                if (updatedRowText.includes('退选')) {
                                                    reallySelected = true;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        if (reallySelected) {
                                            // 真正选课成功，重置失败计数器
                                            failedAttempts = 0;
                                            log(`🎊 确认选课成功: ${teachingClass.info.className}！`, 'success');
                                            
                                            // 显示成功通知
                                            try {
                                                if (window.Notification && Notification.permission === 'granted') {
                                                    new Notification('抢课成功！', {
                                                        body: `成功选择教学班: ${teachingClass.info.className}`,
                                                        icon: '/favicon.ico'
                                                    });
                                                }
                                                
                                                alert(`🎉 抢课成功！\n课程号: ${TARGET_COURSE_CODE}\n教学班: ${teachingClass.info.className}\n教师: ${teachingClass.info.teacher}`);
                                            } catch (e) {
                                                // 忽略通知错误
                                            }
                                            
                                            stopGrabbing();
                                        } else {
                                            // 实际上没有选课成功，增加重试计数
                                            failedAttempts++;
                                            log(`⚠️ 选课请求已发送但未确认成功 (失败次数: ${failedAttempts}/${MAX_FAILED_ATTEMPTS})`, 'warning');
                                            
                                            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                                                log(`❌ 连续失败 ${MAX_FAILED_ATTEMPTS} 次，可能是网络问题或系统异常，停止脚本`, 'error');
                                                alert(`抢课脚本已停止\n原因: 连续多次选课请求失败\n建议: 检查网络连接或手动刷新页面后重试`);
                                                stopGrabbing();
                                            }
                                        }
                                        isSelecting = false;
                                    }, 3000); // 等待3秒再验证
                                }
                            }, 1000);
                            
                            break;
                        }
                    }
                }, 500);
                
                return true;
            } else {
                log('未找到可点击的选课元素', 'warning');
                isSelecting = false;
                return false;
            }
        } catch (error) {
            log(`选择教学班失败: ${error.message}`, 'error');
            isSelecting = false;
            return false;
        }
    }
    
    // 刷新课程列表
    function refreshCourseList() {
        try {
            // 尝试触发页面刷新或重新搜索
            const searchBtn = document.querySelector('button[onclick*="search"], input[value*="搜索"], input[value*="查询"]');
            if (searchBtn) {
                searchBtn.click();
                log('已触发课程列表刷新');
            } else {
                // 如果没有搜索按钮，尝试刷新页面数据
                if (typeof jQuery !== 'undefined' && jQuery('#searchBox').length) {
                    jQuery('#searchBox').trigger('searchResult');
                    log('已触发jQuery搜索刷新');
                }
            }
        } catch (error) {
            log(`刷新课程列表失败: ${error.message}`, 'warning');
        }
    }
    
    // 主抢课逻辑
    function attemptGrabCourse() {
        if (isSelecting) {
            log('当前正在处理选课操作，跳过本次尝试', 'info');
            return;
        }
        
        attemptCount++;
        log(`第 ${attemptCount} 次尝试抢课`);
        
        if (attemptCount > MAX_ATTEMPTS) {
            log(`已达到最大尝试次数 ${MAX_ATTEMPTS}，停止抢课`, 'warning');
            stopGrabbing();
            return;
        }
        
        // 查找所有教学班
        const teachingClasses = findAllTeachingClasses();
        if (teachingClasses.length === 0) {
            log(`未找到课程号 ${TARGET_COURSE_CODE} 的任何教学班`, 'warning');
            return;
        }
        
        // 设置标志：是否有时间不冲突但人数已满的教学班
        let hasNonConflictedFullClass = false;
        
        // 逐个尝试所有教学班
        for (let tc of teachingClasses) {
            // 确保教学班信息完整
            if (!tc || !tc.info || !tc.info.id) {
                continue;
            }
            
            const classId = tc.info.id;
            
            // 检查是否已经因时间冲突被标记
            if (conflictedClasses.has(classId)) {
                continue;
            }
            
            // 检查是否已经尝试过
            if (triedTeachingClasses.has(classId)) {
                continue;
            }
            
            // 检查是否有选课按钮（排除退选按钮）
            const rowText = tc.row ? tc.row.textContent : '';
            if (rowText.includes('退选')) {
                continue;
            }
            
            if (!rowText.includes('选课')) {
                continue;
            }
            
            // 检查容量
            const hasCapacity = checkTeachingClassCapacity(tc);
            
            if (hasCapacity) {
                // 有余量，直接尝试选课
                log(`🎯 发现有余量的教学班: ${tc.info.className}`, 'success');
                log(`📚 教师: ${tc.info.teacher}`);
                log(`⏰ 时间: ${tc.info.timeInfo}`);
                log(`👥 容量: ${tc.info.capacity}`);
                
                const selectResult = selectTeachingClass(tc);
                if (selectResult) {
                    return; // 尝试选课后等待结果
                }
            } else {
                // 没有余量，但时间不冲突，设置标志
                hasNonConflictedFullClass = true;
            }
        }
        
        // 检查是否所有教学班都时间冲突
        if (!hasNonConflictedFullClass && conflictedClasses.size > 0) {
            log('🛑 所有教学班都存在时间冲突，停止抢课！', 'error');
            stopGrabbing();
            alert(`⚠️ 时间冲突警告\n\n课程 ${TARGET_COURSE_CODE} 的所有教学班都与您已选课程时间冲突。\n冲突的教学班数量: ${conflictedClasses.size}\n\n请手动检查课程表并解决时间冲突问题。`);
            return;
        }
        
        // 重置已尝试列表，继续轮询
        if (triedTeachingClasses.size > 0) {
            triedTeachingClasses.clear();
        }
    }
    
    // 开始抢课
    function startGrabbing() {
        if (isRunning) {
            log('抢课脚本已在运行中！', 'warning');
            return;
        }
        
        // 请求通知权限
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        isRunning = true;
        attemptCount = 0;
        failedAttempts = 0;                // 重置失败计数器
        triedTeachingClasses.clear();      // 重置已尝试教学班
        conflictedClasses.clear();         // 重置冲突教学班
        
        log(`🚀 开始监控课程 ${TARGET_COURSE_CODE}`, 'success');
        log(`⏱️ 检查间隔: ${CHECK_INTERVAL/1000} 秒`);
        log(`🎯 最大尝试次数: ${MAX_ATTEMPTS}`);
        
        // 立即执行一次
        attemptGrabCourse();
        
        // 设置定时器
        intervalId = setInterval(() => {
            // 每20次尝试刷新一次课程列表
            if (attemptCount % 20 === 0) {
                refreshCourseList();
                setTimeout(attemptGrabCourse, 1000); // 刷新后等待1秒再尝试
            } else {
                attemptGrabCourse();
            }
        }, CHECK_INTERVAL);
    }
    
    // 停止抢课
    function stopGrabbing() {
        if (!isRunning) {
            log('抢课脚本未运行', 'info');
            return;
        }
        
        isRunning = false;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        
        log('⏹️ 抢课脚本已停止', 'warning');
    }
    
    // 获取状态
    function getStatus() {
        const status = {
            isRunning: isRunning,
            attemptCount: attemptCount,
            targetCourse: TARGET_COURSE_CODE,
            checkInterval: CHECK_INTERVAL,
            maxAttempts: MAX_ATTEMPTS,
            triedClasses: Array.from(triedTeachingClasses),
            conflictedClasses: Array.from(conflictedClasses)
        };
        
        console.table(status);
        log(`已尝试教学班: ${triedTeachingClasses.size}个`);
        log(`时间冲突教学班: ${conflictedClasses.size}个`);
        return status;
    }
    
    // 暴露全局控制接口
    window.courseGrabber = {
        start: startGrabbing,
        stop: stopGrabbing,
        status: getStatus,
        debug: () => {
            log('=== 调试信息 ===', 'info');
            const classes = findAllTeachingClasses();
            log(`找到 ${classes.length} 个教学班`, 'info');
            classes.forEach((tc, index) => {
                const rowText = tc.row ? tc.row.textContent : '';
                
                // 查找所有数字/数字格式
                const allCapacityMatches = rowText.match(/\d+\/\d+/g) || [];
                
                // 查找选课元素
                let selectElement = null;
                let selectElementInfo = '无选课元素';
                
                if (tc.row) {
                    const allElements = tc.row.querySelectorAll('*');
                    for (let element of allElements) {
                        const elementText = element.textContent.trim();
                        if (elementText === '选课' || elementText.includes('选课')) {
                            if (!elementText.includes('退选')) {
                                selectElement = element;
                                selectElementInfo = `${element.tagName}(${elementText})`;
                                break;
                            }
                        }
                    }
                    
                    // 如果没找到选课元素，列出所有可点击元素
                    if (!selectElement) {
                        const clickableElements = tc.row.querySelectorAll('button, a, input[type="button"], [onclick]');
                        const clickableInfo = Array.from(clickableElements).map(el => 
                            `${el.tagName}(${el.textContent.trim()})`
                        ).join(', ');
                        selectElementInfo = `可点击元素: ${clickableInfo || '无'}`;
                    }
                }
                
                // 检查选课/退选状态
                const isSelectAvailable = rowText.includes('选课');
                const isDropAvailable = rowText.includes('退选');
                
                log(`教学班 ${index + 1}:`, 'info');
                log(`  名称: ${tc.info.className}`, 'info');
                log(`  教师: ${tc.info.teacher}`, 'info');
                log(`  容量: ${tc.info.capacity}`, 'info');
                log(`  所有容量信息: [${allCapacityMatches.join(', ')}]`, 'info');
                log(`  时间: ${tc.info.timeInfo}`, 'info');
                log(`  选课元素: ${selectElementInfo}`, 'info');
                log(`  行包含选课: ${isSelectAvailable}`, 'info');
                log(`  行包含退选: ${isDropAvailable}`, 'info');
                log(`  ID: ${tc.info.id}`, 'info');
                log(`  有余量: ${checkTeachingClassCapacity(tc)}`, 'info');
                log(`  已尝试: ${triedTeachingClasses.has(tc.info.id)}`, 'info');
                log(`  时间冲突: ${conflictedClasses.has(tc.info.id)}`, 'info');
                log(`  可选择: ${isSelectAvailable && !isDropAvailable && checkTeachingClassCapacity(tc) && !conflictedClasses.has(tc.info.id)}`, 'info');
            });
            return classes;
        }
    };
    
    // 显示脚本信息
    console.log('%c🎓 上海大学自动抢课脚本已加载', 'color: #ff6b35; font-size: 18px; font-weight: bold;');
    console.log('%c📚 目标课程: ' + TARGET_COURSE_CODE, 'color: #4ecdc4; font-size: 14px; font-weight: bold;');
    console.log('%c⚡ 使用方法:', 'color: #45b7d1; font-size: 14px; font-weight: bold;');
    console.log('  courseGrabber.start()  - 🚀 开始抢课');
    console.log('  courseGrabber.stop()   - ⏹️ 停止抢课');
    console.log('  courseGrabber.status() - 📊 查看状态');
    console.log('  courseGrabber.debug()  - 🔍 调试信息');
    console.log('%c⚠️ 提醒: 确保您在正确的选课页面且已登录！', 'color: #ffa500; font-weight: bold;');
    console.log('%c🛡️ 智能保护: 自动处理多教学班和时间冲突', 'color: #ff69b4; font-weight: bold;');
    console.log('%c📋 功能特性:', 'color: #9370db; font-weight: bold;');
    console.log('  • 自动识别同一课程的多个教学班');
    console.log('  • 时间冲突时自动尝试其他教学班');
    console.log('  • 所有教学班都冲突时自动停止');
})();
