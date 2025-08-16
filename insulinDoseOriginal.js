// pages/insulinDoseOriginal/insulinDoseOriginal.js
var app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    /*patient_id要从上一页获取 */
    patient_id: 0,
    //基础信息
    basalInfo: {
      bw: 92, //体重
      ageIndex: 0, //年龄段
      diaTypeIndex: 0, //糖尿病类型
      ifCureIndex: 0, //是否接受过治疗
      cureTDI: 23, //已接受治疗的患者的每日胰岛素总量（U）
      bgConIndex: 0, //血糖控制情况
      idealBG: [79.2, 124.2, 120.6, 144.0], //目标血糖控制水平【餐前低值、餐前高值、餐后低值、餐后高值】
    },
    ageGroup: ['青春期前期', '青春期至成年人', '成年人'],
    diaTypeArray: ['1型糖尿病', '2型糖尿病', '妊娠性糖尿病', '其他'],
    ifCureArray: ['否', '是'],
    BGConArray: ['血糖控制良好', '经常发生低血糖', '高血糖、极少或无低血糖'],
    //胰岛素泵6个时间段设置
    pumpTimeSlice: ['00:00-03:00', '03:00-08:00', '08:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00'],
    //每日就餐&就寝安排（24小时制）
    dailyLife: {
      breakfast: 8, //早餐时间
      lunch: 12, //午餐时间
      dinner: 18, //晚餐时间
    },
    dailyTime: ['0', '1', 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], //24小时
    showOld: false,
    
    // ===== 新增：当前生效的胰岛素剂量数据 =====
    currentInsulinData: {
      totalDose: 0,        // 当前总剂量
      basalDose: 0,        // 当前基础剂量
      bolusDose: 0,        // 当前餐时剂量
      isFromRFPrediction: false  // 标记是否来自RF预测
    },
    
    //历史胰岛素方案
    oldInsulinPlan: {
      oldTDI: 20, //全天胰岛素总剂量
      oldBasalTDI: 18, //全天基础胰岛素总量
      oldBolusTDI: 2, //全天餐时胰岛素总量
      oldBasalInject: 1.2, //基础注射率（24小时平均）
      oldPumpSlice: [0.5, 1.2, 0.8, 0.9, 1.1, 0.8], //六个基础时间段胰岛素注射率
      oldBolusSlice: [9, 9, 9], //三个餐时胰岛素剂量
    },
    //历史针剂方案
    oldInjectPlan: {
      morningBolus: 10, //早餐前（速效）
      afternoonBolus: 10, //午餐前（速效）
      eveningBolus: 10, //晚餐前（速效）
      bedtimeBasal: 8, //睡前（长效）
    },
    ifShow: false,
    showSave: false, //是否显示保存胰岛素方案的按钮
    
    // ===== 新增：随机森林预测相关数据 =====
    showRFModal: false, // 确保默认为 false
    rfFormData: {
      hypoglycemic_agents: 1,
      fasting_c_peptide: '',
      hba1c: '',
      glycated_albumin: '',
      hypoglycemia: 0
    },
    rfPredictionLoading: false,
    
    // 选择器数据
    hypoglycemicAgentsOptions: [
      { value: 1, label: '1种' },
      { value: 2, label: '2种' },
      { value: 3, label: '3种' },
      { value: 4, label: '4种及以上' }
    ],
    hypoglycemiaOptions: [
      { value: 0, label: '否' },
      { value: 1, label: '是' }
    ]
  },

  adjustTDI(e){
    const {
      mode
    } = e.currentTarget.dataset;
    const {
      value
    } = e.detail;
    this.setData({
      [mode]: value // 将用户输入的内容保存到 data 中
    });
    console.log('mode',mode)
    console.log('value',value)
    this.convert(this.data.oldInsulinPlan.oldBasalTDI,this.data.oldInsulinPlan.oldBolusTDI)
  },

  onLoad(options) {
    console.log("你好，初始胰岛素剂量")
    console.log(options)
    
    // 确保弹窗默认关闭
    this.setData({
      showRFModal: false
    });
    
    if (options.patient_id) {
      this.setData({
        patient_id: parseInt(options.patient_id)
      })
    }

    if (options.basalInfo) {
      this.setData({
        basalInfo: JSON.parse(decodeURIComponent(options.basalInfo))
      })
    }

    this.setData({
      ifShow: this.data.basalInfo.ifCureIndex > 0 ? true : false,
    })

    this.oldCurePlanDecide();
  },

  // 更新体重
  updateBW(e) {
    const {
      value
    } = e.detail;
    var baseInfo = this.data.basalInfo
    baseInfo.bw = value;
    this.setData({
      basalInfo: baseInfo
    });
  },

  selectYes() {
    var baseInfo = this.data.basalInfo
    baseInfo.ifCureIndex = 1
    this.setData({
      basalInfo: baseInfo
    });
    console.log("baseInfo", baseInfo)
  },

  selectNo() {
    var baseInfo = this.data.basalInfo
    baseInfo.ifCureIndex = 0
    this.setData({
      basalInfo: baseInfo
    });
    console.log("baseInfo", baseInfo)
  },

  //初始&旧的胰岛素剂量计算及泵转针剂换算
  oldCurePlanDecide: function () {
    var diaType = parseInt(this.data.basalInfo.diaTypeIndex) + 1;
    var ifCure = parseInt(this.data.basalInfo.ifCureIndex);
    console.log('调整后体重',this.data.basalInfo.bw)

    this.setData({
      showOld: true
    })

    this.setData({
      showSave: true
    })

    if (diaType == 1) {
      const basal = 0.2 * this.data.basalInfo.bw
      const bolus = 0.2 * this.data.basalInfo.bw
      console.log("每日基础总量，餐时总剂量：", basal, bolus)
      this.convert(basal,bolus)
    } 
    else if (diaType == 2) {
      const requestData = {
        "time" : Math.floor(new Date().getTime() / 1000),
        "patient_id": this.data.patient_id
      }
      console.log("Action=Csii requestData",requestData)
      wx.request({
        url: `${app.globalData.protocol}://${app.globalData.host}/bgmp/api/algorithm?Action=Csii`,
        method: 'POST',
        header: {
          "Content-Type": "application/json",
          "x-api-key": wx.getStorageSync('token'),
        },
        data:requestData,
        success: (res) => {
          console.log("获取basal及bolus", res)
          if (res.data.code == 200) {
            const basal = res.data.message.basal
            const bolus = res.data.message.bolus
            console.log("每日基础总量，餐时总剂量：", basal, bolus)
            this.convert(basal,bolus)
          } else {
            console.log("获取basal及bolus失败")
          }
        },
        fail:(res)=>{
          console.log("获取basal及bolus失败")
        }
      })
    }
  },

  convert(basal, bolus, isFromRFPrediction = false){
    console.log("每日基础总量，餐时总剂量：", basal, bolus, "来自RF预测:", isFromRFPrediction)

    const basalrate = basal / 24.0
    const TDI = basal + bolus

    // ===== 新增：更新当前生效的胰岛素数据 =====
    this.setData({
      currentInsulinData: {
        totalDose: TDI,
        basalDose: basal,
        bolusDose: bolus,
        isFromRFPrediction: isFromRFPrediction
      }
    });

    this.setData({
      oldInsulinPlan: {
        oldTDI: TDI, //全天胰岛素总剂量
        oldBasalTDI: basal, //全天基础胰岛素总量
        oldBolusTDI: bolus, //全天餐时胰岛素总量
        oldBasalInject: basalrate, //基础注射率（24小时平均）
        oldPumpSlice: [0.6 * basalrate, 1.2 * basalrate, 1.0 * basalrate, basalrate + 0.1, 1.1 * basalrate, 0.8 * basalrate], //六个基础时间段胰岛素注射率
        oldBolusSlice: [(bolus * 0.4).toFixed(1), (bolus * 0.3).toFixed(1), (bolus * 0.3).toFixed(1)], //三个餐时胰岛素剂量
      }
    })

    this.setData({
      oldInjectPlan: {
        morningBolus: (bolus * 0.4).toFixed(1), //早餐前（速效）
        afternoonBolus: (bolus * 0.3).toFixed(1), //午餐前（速效）
        eveningBolus: (bolus * 0.3).toFixed(1), //晚餐前（速效）
        bedtimeBasal: ((0.6 * 3 + 1.2 * 5 + 1.0 * 4 + 1.1 * 4 + 0.8 * 4) * basalrate + (0.1 + basalrate) * 4).toFixed(1), //睡前（长效）
      }
    })
  },

  //保存胰岛素方案
  saveTherapy: function () {
    // ===== 修改：使用当前生效的胰岛素数据 =====
    const currentData = this.data.currentInsulinData;
    
    // 如果有RF预测数据，优先使用RF预测的数据
    const finalTDI = currentData.isFromRFPrediction ? currentData.totalDose : this.data.oldInsulinPlan.oldTDI;
    const finalBasalTDI = currentData.isFromRFPrediction ? currentData.basalDose : this.data.oldInsulinPlan.oldBasalTDI;
    const finalBolusTDI = currentData.isFromRFPrediction ? currentData.bolusDose : this.data.oldInsulinPlan.oldBolusTDI;
    
    console.log("保存的胰岛素数据:", {
      finalTDI,
      finalBasalTDI, 
      finalBolusTDI,
      isFromRFPrediction: currentData.isFromRFPrediction
    });

    var requestData = {
      "patient_id": parseInt(this.data.patient_id),
      "save_time": Math.floor(Date.now() / 1000),
      "tdi": parseFloat(finalTDI),
      "basal_tdi": parseFloat(finalBasalTDI),
      "bolus_tdi": parseFloat(finalBolusTDI),
      "basal_inject": parseFloat(this.data.oldInsulinPlan.oldBasalInject),
      "pump_0_3": parseFloat(this.data.oldInsulinPlan.oldPumpSlice[0]),
      "pump_3_8": parseFloat(this.data.oldInsulinPlan.oldPumpSlice[1]),
      "pump_8_12": parseFloat(this.data.oldInsulinPlan.oldPumpSlice[2]),
      "pump_12_16": parseFloat(this.data.oldInsulinPlan.oldPumpSlice[3]),
      "pump_16_20": parseFloat(this.data.oldInsulinPlan.oldPumpSlice[4]),
      "pump_20_24": parseFloat(this.data.oldInsulinPlan.oldPumpSlice[5]),
      "breakfast_bolus": parseFloat(this.data.oldInsulinPlan.oldBolusSlice[0]),
      "lunch_bolus": parseFloat(this.data.oldInsulinPlan.oldBolusSlice[1]),
      "dinner_bolus": parseFloat(this.data.oldInsulinPlan.oldBolusSlice[2]),
      "bedtime_basal": parseFloat(this.data.oldInjectPlan.bedtimeBasal),
      // ===== 新增：标记数据来源 =====
      "is_from_rf_prediction": currentData.isFromRFPrediction
    };

    console.log("requestData", requestData);

    wx.request({
      url: `${app.globalData.protocol}://${app.globalData.host}/bgmp/api/insulin?Action=AddInsulinTherapy`,
      method: 'POST',
      header: {
        "Content-Type": "application/json",
        "x-api-key": wx.getStorageSync('token'),
      },
      data: requestData,
      success: (res) => {
        console.log("保存结果：", res)
        if (res.data.code == 200) {
          this.setData({
            showSave: false,
          })
          
          // ===== 新增：根据数据来源显示不同的成功提示 =====
          const successMessage = currentData.isFromRFPrediction ? 
            '智能预测方案保存成功' : '胰岛素方案保存成功';
            
          wx.showToast({
            title: successMessage,
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
            wx.navigateBack();
          }, 2000);

        } else {
          wx.showToast({
            title: '请稍后重试',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },

  // ===== 原有的表单处理方法 =====
  bwBindInput: function (e) {
    console.log('input发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.bw']: e.detail.value
    })
  },

  ageGroupBindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.ageIndex']: e.detail.value
    })
  },

  diaTypeBindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.diaTypeIndex']: e.detail.value
    })
  },

  idealBGBindInput0: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.idealBG[0]']: e.detail.value
    })
  },
  idealBGBindInput1: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.idealBG[1]']: e.detail.value
    })
  },
  idealBGBindInput2: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.idealBG[2]']: e.detail.value
    })
  },
  idealBGBindInput3: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.idealBG[3]']: e.detail.value
    })
  },

  ifCureBindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
        ['basalInfo.ifCureIndex']: e.detail.value
      }),
      this.setData({
        ifShow: this.data.basalInfo.ifCureIndex > 0 ? true : false,
      })
  },

  cureTDIBindInput: function (e) {
    console.log('input发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.cureTDI']: e.detail.value
    })
  },

  bgConBindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['basalInfo.bgConIndex']: e.detail.value
    })
  },

  breakfastbindDateChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['dailyLife.breakfast']: e.detail.value
    })
  },

  lunchbindDateChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['dailyLife.lunch']: e.detail.value
    })
  },

  dinnerbindDateChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      ['dailyLife.dinner']: e.detail.value
    })
  },

  // ===== 新增：随机森林预测相关方法 =====

  /**
   * 显示RF预测弹窗
   */
  showRFPrediction() {
    console.log('显示RF预测弹窗');
    this.setData({ 
      showRFModal: true 
    });
  },

  /**
   * 隐藏RF预测弹窗 - 修复关闭逻辑
   */
  hideRFModal(e) {
    console.log('隐藏RF预测弹窗', e);
    // 无论是点击关闭按钮还是点击遮罩，都关闭弹窗
    this.setData({ 
      showRFModal: false 
    });
  },

  /**
   * 处理弹窗显示状态变化 - 新增方法处理t-popup的visible-change事件
   */
  onRFModalVisibleChange(e) {
    console.log('弹窗可见性变化:', e.detail.visible);
    this.setData({
      showRFModal: e.detail.visible
    });
  },

  /**
   * RF表单输入处理
   */
  onRFInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`rfFormData.${field}`]: value
    });
  },

  /**
   * RF选择器变化处理
   */
  onRFPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseInt(e.detail.value);
    
    if (field === 'hypoglycemic_agents') {
      this.setData({
        [`rfFormData.${field}`]: value + 1 // picker的index转换为实际值
      });
    } else {
      this.setData({
        [`rfFormData.${field}`]: value
      });
    }
  },

  /**
   * 验证RF表单数据
   */
  validateRFForm() {
    const { rfFormData } = this.data;
    
    if (!rfFormData.fasting_c_peptide || isNaN(rfFormData.fasting_c_peptide) || parseFloat(rfFormData.fasting_c_peptide) <= 0) {
      wx.showToast({
        title: '请输入有效的空腹C肽值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!rfFormData.hba1c || isNaN(rfFormData.hba1c) || parseFloat(rfFormData.hba1c) <= 0) {
      wx.showToast({
        title: '请输入有效的糖化血红蛋白值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!rfFormData.glycated_albumin || isNaN(rfFormData.glycated_albumin) || parseFloat(rfFormData.glycated_albumin) <= 0) {
      wx.showToast({
        title: '请输入有效的糖化白蛋白值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    return true;
  },

  /**
   * 执行随机森林预测
   */
  performRFPrediction() {
    if (!this.validateRFForm()) {
      return;
    }

    this.setData({ rfPredictionLoading: true });

    const requestData = {
      hypoglycemic_agents: this.data.rfFormData.hypoglycemic_agents,
      fasting_c_peptide: parseFloat(this.data.rfFormData.fasting_c_peptide),
      hba1c: parseFloat(this.data.rfFormData.hba1c),
      glycated_albumin: parseFloat(this.data.rfFormData.glycated_albumin),
      hypoglycemia: this.data.rfFormData.hypoglycemia
    };

    console.log('RF预测请求数据:', requestData);

    wx.request({
      url: `${app.globalData.protocol}://${app.globalData.host}/bgmp/api/algorithm?Action=RfPredict`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'x-api-key': wx.getStorageSync('token')
      },
      data: requestData,
      success: (res) => {
        console.log('RF预测响应:', res);
        
        if (res.statusCode === 200 && res.data.message.status === 'success') {
          const prediction = res.data.message.prediction;
          
          const total = Math.round(prediction * 10) / 10;
          const basal = Math.round(total / 2 * 10) / 10;
          const bolus = Math.round(total / 2 * 10) / 10;
          
          // ===== 修改：标记数据来源为RF预测 =====
          this.convert(basal, bolus, true);
          
          this.setData({
            showRFModal: false,
            showOld: true,
            showSave: true
          });
          
          wx.showToast({
            title: '智能预测完成！',
            icon: 'success',
            duration: 2000
          });
          
          wx.showModal({
            title: '预测完成',
            content: `基于您提供的临床参数，推荐全天胰岛素总量为 ${total}U\n基础胰岛素：${basal}U\n餐时胰岛素：${bolus}U`,
            showCancel: false,
            confirmText: '知道了'
          });
          
        } else {
          const errorMsg = res.data.error || '预测失败，请检查输入参数';
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        console.error('RF预测请求失败:', err);
        wx.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none',
          duration: 3000
        });
      },
      complete: () => {
        this.setData({ rfPredictionLoading: false });
      }
    });
  },

  /**
   * 重置RF表单数据
   */
  resetRFForm() {
    this.setData({
      rfFormData: {
        hypoglycemic_agents: 1,
        fasting_c_peptide: '',
        hba1c: '',
        glycated_albumin: '',
        hypoglycemia: 0
      }
    });
    
    wx.showToast({
      title: '表单已重置',
      icon: 'success',
      duration: 1000
    });
  }
})