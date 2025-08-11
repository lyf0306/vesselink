// pages/insulinDoseOriginal/insulinDoseOriginal.js
var app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 原有数据（根据实际情况调整字段名）
    weight: '',
    totalInsulin: 0,
    basalInsulin: 0,
    bolusInsulin: 0,
    
    // 可能的其他原有字段（请根据实际情况保留或删除）
    age: '',
    height: '',
    bmi: 0,
    
    // 新增：随机森林预测相关数据
    showRFModal: false,
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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 原有的页面加载逻辑
    console.log('胰岛素剂量页面加载');
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 原有的页面渲染完成逻辑
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 原有的页面显示逻辑
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 原有的页面隐藏逻辑
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 原有的页面卸载逻辑
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 原有的下拉刷新逻辑
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 原有的上拉触底逻辑
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    // 原有的分享逻辑
    return {
      title: '胰岛素剂量计算',
      path: '/pages/insulinDoseOriginal/insulinDoseOriginal'
    };
  },

  // ===== 原有的业务逻辑方法 =====

  /**
   * 体重输入处理
   */
  onWeightInput(e) {
    const weight = parseFloat(e.detail.value) || 0;
    this.setData({ weight: weight });
    this.calculateBasicDose(weight);
  },

  /**
   * 身高输入处理（如果有）
   */
  onHeightInput(e) {
    const height = parseFloat(e.detail.value) || 0;
    this.setData({ height: height });
    this.calculateBMI();
  },

  /**
   * 年龄输入处理（如果有）
   */
  onAgeInput(e) {
    const age = parseInt(e.detail.value) || 0;
    this.setData({ age: age });
  },

  /**
   * 基于体重的基础剂量计算
   */
  calculateBasicDose(weight) {
    if (weight > 0) {
      // 基础计算公式：体重 × 0.4-0.5 U/kg（这里用0.4）
      const total = Math.round(weight * 0.4 * 10) / 10;
      const basal = Math.round(total / 2 * 10) / 10;  // 基础胰岛素占50%
      const bolus = Math.round(total / 2 * 10) / 10;  // 餐时胰岛素占50%
      
      this.setData({
        totalInsulin: total,
        basalInsulin: basal,
        bolusInsulin: bolus
      });
    } else {
      this.setData({
        totalInsulin: 0,
        basalInsulin: 0,
        bolusInsulin: 0
      });
    }
  },

  /**
   * 计算BMI（如果有身高体重功能）
   */
  calculateBMI() {
    const { weight, height } = this.data;
    if (weight > 0 && height > 0) {
      const bmi = Math.round((weight / ((height / 100) * (height / 100))) * 100) / 100;
      this.setData({ bmi: bmi });
    }
  },

  /**
   * 重置表单
   */
  resetForm() {
    this.setData({
      weight: '',
      height: '',
      age: '',
      totalInsulin: 0,
      basalInsulin: 0,
      bolusInsulin: 0,
      bmi: 0
    });
  },

  // ===== 新增：随机森林预测相关方法 =====

  /**
   * 显示RF预测弹窗
   */
  showRFPrediction() {
    this.setData({ showRFModal: true });
  },

  /**
   * 隐藏RF预测弹窗
   */
  hideRFModal() {
    this.setData({ showRFModal: false });
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
    
    // 验证空腹C肽
    if (!rfFormData.fasting_c_peptide || isNaN(rfFormData.fasting_c_peptide) || parseFloat(rfFormData.fasting_c_peptide) <= 0) {
      wx.showToast({
        title: '请输入有效的空腹C肽值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 验证糖化血红蛋白
    if (!rfFormData.hba1c || isNaN(rfFormData.hba1c) || parseFloat(rfFormData.hba1c) <= 0) {
      wx.showToast({
        title: '请输入有效的糖化血红蛋白值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 验证糖化白蛋白
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

    // 构造请求数据
    const requestData = {
      hypoglycemic_agents: this.data.rfFormData.hypoglycemic_agents,
      fasting_c_peptide: parseFloat(this.data.rfFormData.fasting_c_peptide),
      hba1c: parseFloat(this.data.rfFormData.hba1c),
      glycated_albumin: parseFloat(this.data.rfFormData.glycated_albumin),
      hypoglycemia: this.data.rfFormData.hypoglycemia
    };

    console.log('RF预测请求数据:', requestData);

    wx.request({
      url: `${app.globalData.protocol}://${app.globalData.host}/rf_predict`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'x-api-key': wx.getStorageSync('token')
      },
      data: requestData,
      success: (res) => {
        console.log('RF预测响应:', res);
        
        if (res.statusCode === 200 && res.data.status === 'success') {
          const prediction = res.data.prediction;
          
          // 更新胰岛素剂量显示
          // 预测结果作为全天总量，基础和餐时各占一半
          const total = Math.round(prediction * 10) / 10;
          const basal = Math.round(total / 2 * 10) / 10;
          const bolus = Math.round(total / 2 * 10) / 10;
          
          this.setData({
            totalInsulin: total,
            basalInsulin: basal,
            bolusInsulin: bolus,
            showRFModal: false
          });
          
          wx.showToast({
            title: '智能预测完成！',
            icon: 'success',
            duration: 2000
          });
          
          // 同时显示预测结果的详细信息
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
  },

  /**
   * 显示参数说明
   */
  showParameterInfo() {
    wx.showModal({
      title: '参数说明',
      content: '• 降糖药物数量：当前正在使用的降糖药物种类数\n• 空腹C肽：反映胰岛β细胞功能的重要指标\n• 糖化血红蛋白：反映近2-3个月血糖控制情况\n• 糖化白蛋白：反映近2-3周血糖控制情况\n• 低血糖史：是否曾经发生过低血糖',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 保存计算结果（可选功能）
   */
  saveResult() {
    const { totalInsulin, basalInsulin, bolusInsulin, weight } = this.data;
    
    if (totalInsulin <= 0) {
      wx.showToast({
        title: '请先计算胰岛素剂量',
        icon: 'none'
      });
      return;
    }
    
    // 这里可以实现保存到本地存储或发送到服务器
    const result = {
      weight: weight,
      totalInsulin: totalInsulin,
      basalInsulin: basalInsulin,
      bolusInsulin: bolusInsulin,
      timestamp: new Date().getTime()
    };
    
    // 保存到本地存储示例
    let savedResults = wx.getStorageSync('insulinResults') || [];
    savedResults.unshift(result);
    
    // 只保留最近10次记录
    if (savedResults.length > 10) {
      savedResults = savedResults.slice(0, 10);
    }
    
    wx.setStorageSync('insulinResults', savedResults);
    
    wx.showToast({
      title: '结果已保存',
      icon: 'success'
    });
  },

  /**
   * 查看历史记录（可选功能）
   */
  viewHistory() {
    const savedResults = wx.getStorageSync('insulinResults') || [];
    
    if (savedResults.length === 0) {
      wx.showToast({
        title: '暂无历史记录',
        icon: 'none'
      });
      return;
    }
    
    // 这里可以跳转到历史记录页面，或显示简单的列表
    wx.showActionSheet({
      itemList: savedResults.slice(0, 6).map((item, index) => {
        const date = new Date(item.timestamp).toLocaleDateString();
        return `${date} - 总量:${item.totalInsulin}U`;
      }),
      success: (res) => {
        const selectedResult = savedResults[res.tapIndex];
        this.setData({
          weight: selectedResult.weight,
          totalInsulin: selectedResult.totalInsulin,
          basalInsulin: selectedResult.basalInsulin,
          bolusInsulin: selectedResult.bolusInsulin
        });
        
        wx.showToast({
          title: '历史数据已加载',
          icon: 'success'
        });
      }
    });
  }
});