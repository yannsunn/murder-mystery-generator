/**
 * StepManager - ステップナビゲーション管理
 * Strategy パターンで各ステップの処理を分離
 */
class StepManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.totalSteps = options.totalSteps || 5;
    this.currentStep = 1;
    this.stepHistory = [1];
    this.stepValidators = new Map();
    this.stepStrategies = new Map();
    this.stepData = new Map();
    
    this.setupDefaultStrategies();
  }

  /**
   * デフォルトストラテジー設定
   */
  setupDefaultStrategies() {
    // Step 1: 基本設定
    this.addStepStrategy(1, {
      validate: (data) => this.validateBasicSettings(data),
      onEnter: () => this.handleBasicSettingsEnter(),
      onExit: (data) => this.handleBasicSettingsExit(data),
      getProgress: () => this.calculateBasicProgress()
    });

    // Step 2: 世界観設定
    this.addStepStrategy(2, {
      validate: (data) => this.validateWorldSettings(data),
      onEnter: () => this.handleWorldSettingsEnter(),
      onExit: (data) => this.handleWorldSettingsExit(data),
      getProgress: () => this.calculateWorldProgress()
    });

    // Step 3: 事件設定
    this.addStepStrategy(3, {
      validate: (data) => this.validateIncidentSettings(data),
      onEnter: () => this.handleIncidentSettingsEnter(),
      onExit: (data) => this.handleIncidentSettingsExit(data),
      getProgress: () => this.calculateIncidentProgress()
    });

    // Step 4: 詳細オプション
    this.addStepStrategy(4, {
      validate: (data) => this.validateDetailSettings(data),
      onEnter: () => this.handleDetailSettingsEnter(),
      onExit: (data) => this.handleDetailSettingsExit(data),
      getProgress: () => this.calculateDetailProgress()
    });

    // Step 5: 確認・生成
    this.addStepStrategy(5, {
      validate: (data) => this.validateFinalSettings(data),
      onEnter: () => this.handleFinalSettingsEnter(),
      onExit: (data) => this.handleFinalSettingsExit(data),
      getProgress: () => 100
    });
  }

  /**
   * ステップストラテジー追加
   */
  addStepStrategy(stepNumber, strategy) {
    if (!strategy || typeof strategy !== 'object') {
      throw new Error('Strategy must be an object');
    }

    const defaultStrategy = {
      validate: () => true,
      onEnter: () => {},
      onExit: () => {},
      getProgress: () => 0
    };

    this.stepStrategies.set(stepNumber, { ...defaultStrategy, ...strategy });
    return this;
  }

  /**
   * 現在のステップを取得
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * 次のステップに進む
   */
  async goToNextStep() {
    if (this.currentStep >= this.totalSteps) {
      this.emit('step:error', {
        type: 'CANNOT_PROCEED',
        message: '最後のステップです',
        currentStep: this.currentStep
      });
      return false;
    }

    const currentData = this.getCurrentStepData();
    const canProceed = await this.validateCurrentStep(currentData);

    if (!canProceed) {
      this.emit('step:validation:failed', {
        step: this.currentStep,
        data: currentData
      });
      return false;
    }

    return this.navigateToStep(this.currentStep + 1);
  }

  /**
   * 前のステップに戻る
   */
  async goToPreviousStep() {
    if (this.currentStep <= 1) {
      this.emit('step:error', {
        type: 'CANNOT_GO_BACK',
        message: '最初のステップです',
        currentStep: this.currentStep
      });
      return false;
    }

    return this.navigateToStep(this.currentStep - 1);
  }

  /**
   * 特定のステップに移動
   */
  async navigateToStep(targetStep) {
    if (targetStep < 1 || targetStep > this.totalSteps) {
      this.emit('step:error', {
        type: 'INVALID_STEP',
        message: `ステップ ${targetStep} は無効です`,
        targetStep
      });
      return false;
    }

    // アクセス権限チェック
    if (!this.canAccessStep(targetStep)) {
      this.emit('step:error', {
        type: 'ACCESS_DENIED',
        message: `ステップ ${targetStep} にアクセスできません`,
        targetStep
      });
      return false;
    }

    const previousStep = this.currentStep;
    const currentData = this.getCurrentStepData();

    try {
      // 現在のステップの終了処理
      await this.executeStepExit(previousStep, currentData);

      // ステップ変更
      this.currentStep = targetStep;
      this.stepHistory.push(targetStep);

      // 新しいステップの開始処理
      await this.executeStepEnter(targetStep);

      // イベント発火
      this.emit('step:changed', {
        from: previousStep,
        to: targetStep,
        data: currentData,
        history: [...this.stepHistory]
      });

      this.emit(`step:enter:${targetStep}`, {
        step: targetStep,
        previousStep,
        data: this.getStepData(targetStep)
      });

      return true;

    } catch (error) {
      // エラーが発生した場合は元に戻す
      this.currentStep = previousStep;
      this.stepHistory.pop();

      this.emit('step:error', {
        type: 'NAVIGATION_ERROR',
        message: `ステップ ${targetStep} への移動に失敗しました`,
        error,
        targetStep,
        previousStep
      });

      return false;
    }
  }

  /**
   * ステップアクセス権限チェック
   */
  canAccessStep(stepNumber) {
    // 順次アクセスのみ許可（前のステップが完了していることが条件）
    for (let i = 1; i < stepNumber; i++) {
      if (!this.isStepCompleted(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * ステップ完了チェック
   */
  isStepCompleted(stepNumber) {
    const data = this.getStepData(stepNumber);
    const strategy = this.stepStrategies.get(stepNumber);
    
    if (!strategy) return false;

    try {
      return strategy.validate(data);
    } catch (error) {
      Logger.warn(`Step ${stepNumber} validation error:`, error);
      return false;
    }
  }

  /**
   * 現在のステップ検証
   */
  async validateCurrentStep(data) {
    return this.validateStep(this.currentStep, data);
  }

  /**
   * ステップ検証
   */
  async validateStep(stepNumber, data) {
    const strategy = this.stepStrategies.get(stepNumber);
    
    if (!strategy) {
      Logger.warn(`No strategy found for step ${stepNumber}`);
      return false;
    }

    try {
      const result = await strategy.validate(data);
      
      this.emit('step:validated', {
        step: stepNumber,
        data,
        valid: result
      });

      return result;
    } catch (error) {
      this.emit('step:validation:error', {
        step: stepNumber,
        data,
        error
      });
      
      Logger.error(`Step ${stepNumber} validation error:`, error);
      return false;
    }
  }

  /**
   * ステップ開始処理実行
   */
  async executeStepEnter(stepNumber) {
    const strategy = this.stepStrategies.get(stepNumber);
    if (strategy?.onEnter) {
      await strategy.onEnter();
    }
  }

  /**
   * ステップ終了処理実行
   */
  async executeStepExit(stepNumber, data) {
    const strategy = this.stepStrategies.get(stepNumber);
    if (strategy?.onExit) {
      await strategy.onExit(data);
    }
  }

  /**
   * ステップデータ管理
   */
  setStepData(stepNumber, data) {
    this.stepData.set(stepNumber, { ...data });
    
    this.emit('step:data:changed', {
      step: stepNumber,
      data: this.getStepData(stepNumber)
    });
  }

  getStepData(stepNumber) {
    return this.stepData.get(stepNumber) || {};
  }

  getCurrentStepData() {
    return this.getStepData(this.currentStep);
  }

  getAllStepData() {
    const allData = {};
    for (let i = 1; i <= this.totalSteps; i++) {
      allData[`step${i}`] = this.getStepData(i);
    }
    return allData;
  }

  /**
   * 進捗計算
   */
  calculateOverallProgress() {
    let totalProgress = 0;
    
    for (let i = 1; i <= this.totalSteps; i++) {
      const strategy = this.stepStrategies.get(i);
      if (strategy?.getProgress) {
        totalProgress += strategy.getProgress();
      }
    }
    
    return Math.round(totalProgress / this.totalSteps);
  }

  getStepProgress(stepNumber) {
    const strategy = this.stepStrategies.get(stepNumber);
    return strategy?.getProgress ? strategy.getProgress() : 0;
  }

  /**
   * 基本設定バリデーション
   */
  validateBasicSettings(data) {
    const participants = parseInt(data.participants);
    if (!participants || participants < 4 || participants > 8) {
      throw new Error('参加人数は4-8人の範囲で選択してください');
    }

    if (!data.era || !['modern', 'showa', 'near-future', 'fantasy'].includes(data.era)) {
      throw new Error('時代背景を選択してください');
    }

    if (!data.setting) {
      throw new Error('舞台設定を選択してください');
    }

    return true;
  }

  calculateBasicProgress() {
    const data = this.getCurrentStepData();
    let progress = 0;
    
    if (data.participants) progress += 33;
    if (data.era) progress += 33;
    if (data.setting) progress += 34;
    
    return progress;
  }

  handleBasicSettingsEnter() {
    Logger.debug('Entering basic settings step');
    this.emit('ui:focus', { element: '#participants' });
  }

  handleBasicSettingsExit(data) {
    Logger.debug('Exiting basic settings step', data);
    this.setStepData(1, data);
  }

  /**
   * 世界観設定バリデーション
   */
  validateWorldSettings(data) {
    if (!data.worldview) {
      throw new Error('世界観を選択してください');
    }

    if (!data.tone) {
      throw new Error('トーン・雰囲気を選択してください');
    }

    return true;
  }

  calculateWorldProgress() {
    const data = this.getCurrentStepData();
    let progress = 0;
    
    if (data.worldview) progress += 50;
    if (data.tone) progress += 50;
    
    return progress;
  }

  handleWorldSettingsEnter() {
    Logger.debug('Entering world settings step');
    this.emit('ui:update:dependent:fields', this.getStepData(1));
  }

  handleWorldSettingsExit(data) {
    Logger.debug('Exiting world settings step', data);
    this.setStepData(2, data);
  }

  /**
   * 事件設定バリデーション
   */
  validateIncidentSettings(data) {
    if (!data.incident_type) {
      throw new Error('事件の種類を選択してください');
    }

    return true;
  }

  calculateIncidentProgress() {
    const data = this.getCurrentStepData();
    return data.incident_type ? 100 : 0;
  }

  handleIncidentSettingsEnter() {
    Logger.debug('Entering incident settings step');
  }

  handleIncidentSettingsExit(data) {
    Logger.debug('Exiting incident settings step', data);
    this.setStepData(3, data);
  }

  /**
   * 詳細設定バリデーション
   */
  validateDetailSettings(data) {
    if (!data.complexity) {
      throw new Error('複雑さレベルを選択してください');
    }

    return true;
  }

  calculateDetailProgress() {
    const data = this.getCurrentStepData();
    let progress = 0;
    
    if (data.complexity) progress += 70;
    if (data.red_herring || data.twist_ending || data.secret_roles) progress += 30;
    
    return progress;
  }

  handleDetailSettingsEnter() {
    Logger.debug('Entering detail settings step');
  }

  handleDetailSettingsExit(data) {
    Logger.debug('Exiting detail settings step', data);
    this.setStepData(4, data);
  }

  /**
   * 最終設定バリデーション
   */
  validateFinalSettings(data) {
    // 全ステップのデータを確認
    const allData = this.getAllStepData();
    
    for (let i = 1; i < this.totalSteps; i++) {
      if (!this.isStepCompleted(i)) {
        throw new Error(`ステップ ${i} が完了していません`);
      }
    }

    return true;
  }

  handleFinalSettingsEnter() {
    Logger.debug('Entering final settings step');
    this.emit('ui:update:summary', this.getAllStepData());
  }

  handleFinalSettingsExit(data) {
    Logger.debug('Exiting final settings step', data);
    this.setStepData(5, data);
  }

  /**
   * リセット機能
   */
  reset() {
    this.currentStep = 1;
    this.stepHistory = [1];
    this.stepData.clear();
    
    this.emit('step:reset');
    Logger.info('Step manager reset');
  }

  /**
   * 状態保存/復元
   */
  exportState() {
    return {
      currentStep: this.currentStep,
      stepHistory: [...this.stepHistory],
      stepData: Object.fromEntries(this.stepData),
      timestamp: new Date().toISOString()
    };
  }

  importState(state) {
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid state object');
    }

    this.currentStep = state.currentStep || 1;
    this.stepHistory = state.stepHistory || [1];
    this.stepData = new Map(Object.entries(state.stepData || {}));
    
    this.emit('step:state:imported', state);
    Logger.info('Step manager state imported');
  }

  /**
   * デバッグ情報
   */
  getDebugInfo() {
    return {
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      stepHistory: [...this.stepHistory],
      completedSteps: this.getCompletedSteps(),
      overallProgress: this.calculateOverallProgress(),
      stepData: this.getAllStepData(),
      strategies: Array.from(this.stepStrategies.keys())
    };
  }

  getCompletedSteps() {
    const completed = [];
    for (let i = 1; i <= this.totalSteps; i++) {
      if (this.isStepCompleted(i)) {
        completed.push(i);
      }
    }
    return completed;
  }
}

export default StepManager;