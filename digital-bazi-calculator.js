/**
 * 数字八字计算器 JavaScript版本
 * 移植自Python版本的digital_bazi_calculator.py
 */
class DigitalBaziCalculator {
    constructor() {
        // 十二生肖对应数字 - 虽然Python中定义了但未使用，这里保留供扩展
        this.zodiacNumbers = {
            '鼠': 1, '牛': 2, '虎': 3, '兔': 4, '龙': 5, '蛇': 6,
            '马': 7, '羊': 8, '猴': 9, '鸡': 10, '狗': 11, '猪': 12
        };
        
        // 地支对应数字 - 同样保留供扩展
        this.earthlyBranches = {
            '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
            '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
        };
        
        // 对冲数字映射 - 用于计算下卦
        this.oppositionMap = {
            1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 12,
            7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6
        };
    }
    
    /**
     * 阳历转农历
     */
    solarToLunar(year, month, day) {
        if (year < 1900 || year > 2100) {
            return {
                year: year,
                month: month,
                day: Math.min(day, 29)
            };
        }
        
        // 计算从1900年1月31日（农历1900年正月初一）开始的天数
        const baseDate = new Date(1900, 0, 31);
        const targetDate = new Date(year, month - 1, day);
        const offset = Math.floor((targetDate - baseDate) / (24 * 60 * 60 * 1000));
        
        if (offset < 0) {
            return { year: 1900, month: 1, day: 1 };
        }
        
        let lunarYear = 1900;
        let remainingDays = offset;
        
        // 逐年减去天数，直到找到目标年份
        while (lunarYear < 2101 && remainingDays > 0) {
            const yearDays = this.getLunarYearDays(lunarYear);
            if (remainingDays < yearDays) {
                break;
            }
            remainingDays -= yearDays;
            lunarYear++;
        }
        
        // 计算月份
        let lunarMonth = 1;
        const leapMonth = this.getLeapMonth(lunarYear);
        let isLeap = false;
        
        // 逐月减去天数
        for (let m = 1; m <= 12; m++) {
            // 正常月份
            const normalMonthDays = this.getLunarMonthDays(lunarYear, m, false);
            if (remainingDays < normalMonthDays) {
                lunarMonth = m;
                break;
            }
            remainingDays -= normalMonthDays;
            
            // 如果当前月是闰月，还要检查闰月
            if (leapMonth === m) {
                const leapMonthDays = this.getLunarMonthDays(lunarYear, m, true);
                if (remainingDays < leapMonthDays) {
                    lunarMonth = m;
                    isLeap = true;
                    break;
                }
                remainingDays -= leapMonthDays;
            }
        }
        
        const lunarDay = remainingDays + 1;
        
        return {
            year: lunarYear,
            month: lunarMonth,
            day: lunarDay,
            isLeap: isLeap
        };
    }
    
    /**
     * 农历转阳历（简化版本）
     */
    lunarToSolar(year, month, day) {
        if (year < 1900 || year > 2100) {
            return {
                year: year,
                month: month,
                day: day
            };
        }
        
        // 计算从农历1900年正月初一开始的天数
        let totalDays = 0;
        
        // 加上之前年份的天数
        for (let y = 1900; y < year; y++) {
            totalDays += this.getLunarYearDays(y);
        }
        
        // 加上当年之前月份的天数
        const leapMonth = this.getLeapMonth(year);
        for (let m = 1; m < month; m++) {
            totalDays += this.getLunarMonthDays(year, m, false);
            // 如果当前月是闰月，还要加上闰月天数
            if (leapMonth === m) {
                totalDays += this.getLunarMonthDays(year, m, true);
            }
        }
        
        // 加上当月的天数
        totalDays += day - 1;
        
        // 从1900年1月31日开始计算
        const baseDate = new Date(1900, 0, 31);
        const resultDate = new Date(baseDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
        
        return {
            year: resultDate.getFullYear(),
            month: resultDate.getMonth() + 1,
            day: resultDate.getDate()
        };
    }
    
    /**
     * 获取农历年份的总天数
     */
    getLunarYearDays(year) {
        if (year < 1900 || year > 2100) {
            return 354;
        }
        
        const lunarData = this.getLunarData();
        const yearData = lunarData[year - 1900];
        let totalDays = 0;
        
        // 计算12个正常月的天数
        for (let i = 0; i < 12; i++) {
            const mask = 0x8000 >> i;
            totalDays += (yearData & mask) ? 30 : 29;
        }
        
        // 如果有闰月，加上闰月天数
        const leapMonth = this.getLeapMonth(year);
        if (leapMonth > 0) {
            // 闰月天数由第17位（0x10000）决定
            totalDays += (yearData & 0x10000) ? 30 : 29;
        }
        
        return totalDays;
    }
    
    /**
     * 获取农历指定月份天数
     */
    getLunarMonthDays(year, month, isLeap = false) {
        if (year < 1900 || year > 2100) {
            return (month % 2 === 1) ? 30 : 29;
        }
        
        const lunarData = this.getLunarData();
        const yearData = lunarData[year - 1900];
        
        if (isLeap) {
            // 闰月天数
            return (yearData & 0x10000) ? 30 : 29;
        } else {
            // 正常月份天数
            const mask = 0x8000 >> (month - 1);
            return (yearData & mask) ? 30 : 29;
        }
    }
    
    /**
     * 判断是否为农历闰年
     */
    isLunarLeapYear(year) {
        return this.getLeapMonth(year) !== 0;
    }
    
    /**
     * 获取闰月月份
     */
    getLeapMonth(year) {
        if (year < 1900 || year > 2100) {
            return 0;
        }
        const lunarData = this.getLunarData();
        return lunarData[year - 1900] & 0xf;
    }
    

    
    /**
     * 获取农历数据（占位符，实际可扩展为完整数据表）
     */
    getLunarData() {
        // 农历1900-2100的润大小信息表 (来源：香港天文台)
        return [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,//1900-1909
            0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,//1910-1919
            0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,//1920-1929
            0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,//1930-1939
            0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,//1940-1949
            0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,//1950-1959
            0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,//1960-1969
            0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,//1970-1979
            0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,//1980-1989
            0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,//1990-1999
            0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,//2000-2009
            0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,//2010-2019
            0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,//2020-2029
            0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,//2030-2039
            0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,//2040-2049
            0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50, 0x06b20,0x1a6c4,0x0aae0,//2050-2059
            0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,//2060-2069
            0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,//2070-2079
            0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,//2080-2089
            0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,//2090-2099
            0x0d520];//2100
    }
    
    /**
     * 计算年柱数字
     * 根据农历年份计算对应数字
     */
    calculateYearPillar(lunarYear) {
        let result;
        if (1900 <= lunarYear && lunarYear <= 1999) {
            // 1900-1999年：年份数字最后两位+1除以12得到的余数(1到12)
            const lastTwoDigits = lunarYear % 100;
            result = (lastTwoDigits + 1) % 12;
        } else {
            // 2000年之后：年份数字最后两位+5除以12得到的余数(1到12)
            const lastTwoDigits = lunarYear % 100;
            result = (lastTwoDigits + 5) % 12;
        }
        
        return result === 0 ? 12 : result;
    }
    
    /**
     * 计算月柱数字
     * 正月-1，二-2，...，腊月-12
     */
    calculateMonthPillar(lunarMonth) {
        return lunarMonth;
    }
    
    /**
     * 计算日柱数字
     * 农历日期转换为数字数组
     */
    calculateDayPillar(lunarDay) {
        if (1 <= lunarDay && lunarDay <= 12) {
            return [lunarDay];
        } else if (13 <= lunarDay && lunarDay <= 19) {
            return [1, 10, lunarDay - 12];
        } else if (20 <= lunarDay && lunarDay <= 29) {
            if (lunarDay === 20) {
                return [2, 10];
            } else {
                return [2, 10, lunarDay - 20];
            }
        } else if (lunarDay === 30) {
            return [3, 10];
        } else {
            throw new Error(`无效的阴历日期: ${lunarDay}`);
        }
    }
    
    /**
     * 根据时辰计算时柱数字
     * 支持浮点数输入，如1.10表示1点10分
     * 时辰划分：23-1点为1，1-3点为2，3-5点为3，...，21-23点为12
     * 如果hour为0.7，返回null（表示未知时辰）
     */
    calculateHourPillar(hour) {
        // 如果时辰为0.7，表示未知时辰，返回null
        if (hour === 0.7) {
            return null;
        }
        
        // 验证输入范围
        if (hour < 0 || hour >= 24) {
            throw new Error(`无效的小时: ${hour}，应在0-23.59之间`);
        }
        
        // 处理小数部分（分钟）
        const hourInt = Math.floor(hour);
        const minuteDecimal = hour - hourInt;
        
        // 将小数部分转换为分钟（假设.10表示10分钟）
        const minutes = minuteDecimal * 100;
        if (minutes >= 60) {
            throw new Error(`无效的分钟: ${minutes}，应在0-59之间`);
        }
        
        // 转换为实际的小时数（包含分钟）
        const actualHour = hourInt + minutes / 60.0;
        
        // 按照新的时辰划分规则
        if ((actualHour >= 23) || (actualHour < 1)) { // 23-1点
            return 1;
        } else if (actualHour >= 1 && actualHour < 3) { // 1-3点
            return 2;
        } else if (actualHour >= 3 && actualHour < 5) { // 3-5点
            return 3;
        } else if (actualHour >= 5 && actualHour < 7) { // 5-7点
            return 4;
        } else if (actualHour >= 7 && actualHour < 9) { // 7-9点
            return 5;
        } else if (actualHour >= 9 && actualHour < 11) { // 9-11点
            return 6;
        } else if (actualHour >= 11 && actualHour < 13) { // 11-13点
            return 7;
        } else if (actualHour >= 13 && actualHour < 15) { // 13-15点
            return 8;
        } else if (actualHour >= 15 && actualHour < 17) { // 15-17点
            return 9;
        } else if (actualHour >= 17 && actualHour < 19) { // 17-19点
            return 10;
        } else if (actualHour >= 19 && actualHour < 21) { // 19-21点
            return 11;
        } else if (actualHour >= 21 && actualHour < 23) { // 21-23点
            return 12;
        } else {
            throw new Error(`无法确定时辰: ${hour}`);
        }
    }
    
    /**
     * 计算上卦
     * 根据年月日时计算上卦数字数组
     */
    calculateUpperGua(lunarYear, lunarMonth, lunarDay, hour) {
        const yearPillar = this.calculateYearPillar(lunarYear);
        const monthPillar = this.calculateMonthPillar(lunarMonth);
        const dayPillar = this.calculateDayPillar(lunarDay);
        const hourPillar = this.calculateHourPillar(hour);
        
        const upperGua = [yearPillar, monthPillar].concat(dayPillar).concat([hourPillar]);
        return upperGua;
    }
    
    /**
     * 计算下卦（对冲）
     * 根据上卦计算对冲的下卦
     */
    calculateLowerGua(upperGua) {
        const lowerGua = [];
        for (const num of upperGua) {
            if (num === null) {
                lowerGua.push(null);
            } else {
                lowerGua.push(this.oppositionMap[num]);
            }
        }
        return lowerGua;
    }
    
    /**
     * 格式化出生时间显示
     */
    formatBirthTime(hour) {
        if (hour === 0.7) {
            return "无";
        }
        
        // 将浮点数时间转换为小时和分钟
        const hourInt = Math.floor(hour);
        const minuteDecimal = hour - hourInt;
        // 将小数部分转换为分钟，四舍五入到最接近的整数
        let minutes = Math.round(minuteDecimal * 100);
        
        // 确保分钟在有效范围内
        if (minutes >= 60) {
            minutes = 59;
        }
        
        // 判断时间段
        let timePeriod, displayHour;
        if (hourInt === 0) {
            timePeriod = "凌晨";
            displayHour = 12;
        } else if (1 <= hourInt && hourInt < 6) {
            timePeriod = "凌晨";
            displayHour = hourInt;
        } else if (6 <= hourInt && hourInt < 12) {
            timePeriod = "早上";
            displayHour = hourInt;
        } else if (hourInt === 12) {
            timePeriod = "中午";
            displayHour = 12;
        } else if (13 <= hourInt && hourInt < 18) {
            timePeriod = "下午";
            displayHour = hourInt - 12;
        } else if (18 <= hourInt && hourInt < 24) {
            timePeriod = "晚上";
            displayHour = hourInt - 12;
        } else {
            timePeriod = "晚上";
            displayHour = hourInt - 12;
        }
        
        return `出生时间${timePeriod}${displayHour}点${minutes.toString().padStart(2, '0')}分`;
    }
    
    /**
     * 主要计算函数
     * 计算数字八字，返回完整结果
     */
    calculateBazi(birthYear, birthMonth, birthDay, birthHour, isLunar) {
        let solarDate, lunarDate;
        let lunarYear, lunarMonth, lunarDay;
        let adjustedNote = '';
        
        // 如果是阳历，转换为阴历
        if (!isLunar) {
            // 记录原始输入的阳历日期
            solarDate = `${birthYear}年${birthMonth}月${birthDay}日`;
            
            // 阳历转农历
            const lunar = this.solarToLunar(birthYear, birthMonth, birthDay);
            lunarYear = lunar.year;
            lunarMonth = lunar.month;
            lunarDay = lunar.day;

            // 时间替换/安全校正：简化转换可能返回>30的日期，按需求自动替换为30日
            let adjusted = false;
            if (lunarDay > 30) { lunarDay = 30; adjusted = true; }
            if (lunarDay < 1) { lunarDay = 1; adjusted = true; }
            if (lunarMonth < 1) { lunarMonth = 1; adjusted = true; }
            if (lunarMonth > 12) { lunarMonth = 12; adjusted = true; }
            if (adjusted) {
                adjustedNote = '（自动校正）';
            }

            lunarDate = `${lunarYear}年${lunarMonth}月${lunarDay}日${adjustedNote}`;
        } else {
            // 如果输入的是农历，转换为阳历
            lunarYear = birthYear;
            lunarMonth = birthMonth;
            lunarDay = birthDay;
            lunarDate = `${birthYear}年${birthMonth}月${birthDay}日`;
            
            // 农历转阳历
            const solar = this.lunarToSolar(birthYear, birthMonth, birthDay);
            solarDate = `${solar.year}年${solar.month}月${solar.day}日`;
        }
        
        // 计算上卦
        const upperGua = this.calculateUpperGua(lunarYear, lunarMonth, lunarDay, birthHour);
        
        // 计算下卦
        const lowerGua = this.calculateLowerGua(upperGua);
        
        // 格式化出生时间
        const birthTime = this.formatBirthTime(birthHour);
        
        return {
            upperGua,
            lowerGua,
            solarDate,
            lunarDate,
            birthTime
        };
    }
    
    /**
     * 根据数字获取五行分类
     */
    getWuxingCategory(number) {
        const wuxingMap = {
            1: "水", 2: "水", 12: "水",    // 水
            4: "木", 5: "木",              // 木
            6: "火", 7: "火",              // 火
            3: "土", 8: "土", 9: "土",     // 土
            10: "金", 11: "金"             // 金
        };
        return wuxingMap[number] || "未知";
    }

    /**
     * 统计五行数字出现次数并格式化输出，显示具体出现的数字
     */
    countWuxingOccurrences(upperGua, lowerGua) {
        // 定义五行分类（按用户要求的顺序）
        const wuxingGroups = [
            ["土", [3, 9, 8]],
            ["木", [4, 5]],
            ["金", [10, 11]],
            ["水", [1, 2, 12]],
            ["火", [6, 7]]
        ];
        
        // 收集上卦和下卦中的数字
        const upperNumbers = upperGua.filter(num => num !== null);
        const lowerNumbers = lowerGua.filter(num => num !== null);
        
        // 格式化输出
        const resultLines = [];
        for (const [wuxing, numbers] of wuxingGroups) {
            // 找出该五行在上卦和下卦中出现的具体数字
            const upperFound = upperNumbers.filter(num => numbers.includes(num));
            const lowerFound = lowerNumbers.filter(num => numbers.includes(num));
            
            // 计算总出现次数
            const total = upperFound.length + lowerFound.length;
            
            // 将出现的数字合并为一个序列，用 " - " 连接（不再显示映射的所有数字）
            const foundUnified = [...upperFound, ...lowerFound];
            const foundStr = foundUnified.join(" - ");
            
            // 格式化输出行：仅显示五行与出现次数，若有则追加具体数字
            let line;
            if (total > 0) {
                line = `${wuxing}\t出现${total}次：${foundStr}`;
            } else {
                line = `${wuxing}\t出现${total}次`;
            }
            resultLines.push(line);
        }
        
        return resultLines.join("\n");
    }

    /**
     * 格式化结果为显示字符串
     */
    formatResult(upperGua, lowerGua, solarDate, lunarDate, birthTime) {
        const upperStr = upperGua.map(x => x === null ? 'null' : x).join(' - ');
        const lowerStr = lowerGua.map(x => x === null ? 'null' : x).join(' - ');
        
        // 添加五行统计
        const wuxingStats = this.countWuxingOccurrences(upperGua, lowerGua);
        
        return `阳历：${solarDate}\n阴历：${lunarDate}\n${birthTime}\n上卦：${upperStr}\n下卦：${lowerStr}\n\n五行统计：\n${wuxingStats}`;
    }
}

// 导出计算器类供其他文件使用
window.DigitalBaziCalculator = DigitalBaziCalculator;