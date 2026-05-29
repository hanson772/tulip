<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Welcome"
    width="380px"
    :close-on-click-modal="false"
    top="8vh"
    destroy-on-close
  >
    <el-tabs v-model="activeTab" stretch>
      <!-- Login Tab -->
      <el-tab-pane label="Login" name="login">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="Email" prop="email">
            <el-input v-model="loginForm.email" placeholder="Enter your email" />
          </el-form-item>
          <el-form-item label="Password" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Enter your password"
              show-password
            />
          </el-form-item>
          <el-form-item label="Captcha" prop="captchaCode">
            <div style="display:flex;gap:8px;width:100%">
              <el-input
                v-model="loginForm.captchaCode"
                placeholder="Captcha code"
                maxlength="4"
                style="width:120px"
              />
              <div
                style="flex:1;cursor:pointer;border:1px solid #dcdfe6;border-radius:4px;display:flex;align-items:center;justify-content:center;min-height:32px;background:#fafafa"
                @click="refreshCaptcha"
                title="Click to refresh"
              >
                <span v-if="!captchaSvg" style="color:#999;font-size:12px">Load Captcha</span>
                <span v-html="captchaSvg" style="display:flex;align-items:center"></span>
              </div>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="loginLoading"
              native-type="submit"
              style="width: 100%"
            >
              {{ loginLoading ? 'Logging in...' : 'Login' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- Register Tab -->
      <el-tab-pane label="Register" name="register">
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-position="top"
          @submit.prevent="handleRegister"
        >
          <el-form-item label="Name" prop="name">
            <el-input v-model="registerForm.name" placeholder="Enter your name" />
          </el-form-item>
          <el-form-item label="Email" prop="email">
            <el-input v-model="registerForm.email" placeholder="Enter your email" />
          </el-form-item>
          <el-form-item label="Password" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="Create a password (min 6 chars)"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="success"
              :loading="registerLoading"
              native-type="submit"
              style="width: 100%"
            >
              {{ registerLoading ? 'Creating Account...' : 'Register' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus';

export default {
  name: 'LoginDialog',
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue'],
  data() {
    return {
      activeTab: 'login',
      loginForm: { email: '', password: '', captchaCode: '' },
      registerForm: { name: '', email: '', password: '' },
      loginLoading: false,
      registerLoading: false,
      captchaSvg: null,
      captchaId: null,
      loginRules: {
        email: [
          { required: true, message: 'Email is required', trigger: 'blur' },
          { type: 'email', message: 'Invalid email format', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Password is required', trigger: 'blur' },
          { min: 6, message: 'Min 6 characters', trigger: 'blur' }
        ],
        captchaCode: [
          { required: true, message: 'Captcha is required', trigger: 'blur' },
          { min: 4, max: 4, message: '4 characters', trigger: 'blur' }
        ]
      },
      registerRules: {
        name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
        email: [
          { required: true, message: 'Email is required', trigger: 'blur' },
          { type: 'email', message: 'Invalid email format', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Password is required', trigger: 'blur' },
          { min: 6, message: 'Min 6 characters', trigger: 'blur' }
        ]
      }
    };
  },
  watch: {
    modelValue(val) {
      if (val) this.refreshCaptcha();
    }
  },
  methods: {
    async handleLogin() {
      const valid = await this.$refs.loginFormRef.validate().catch(() => false);
      if (!valid) return;

      this.loginLoading = true;
      const result = await this.$store.dispatch('login', {
        email: this.loginForm.email,
        password: this.loginForm.password,
        captchaId: this.captchaId,
        captchaCode: this.loginForm.captchaCode,
      });
      this.loginLoading = false;

      if (result.success) {
        ElMessage.success('Login successful');
        this.$emit('update:modelValue', false);
        this.resetForms();
        window.location.reload();
      } else {
        ElMessage.error(result.message);
        this.refreshCaptcha();
      }
    },
    async handleRegister() {
      const valid = await this.$refs.registerFormRef.validate().catch(() => false);
      if (!valid) return;

      this.registerLoading = true;
      const result = await this.$store.dispatch('register', {
        name: this.registerForm.name,
        email: this.registerForm.email,
        password: this.registerForm.password
      });
      this.registerLoading = false;

      if (result.success) {
        ElMessage.success('Registration successful');
        this.$emit('update:modelValue', false);
        this.resetForms();
        window.location.reload();
      } else {
        ElMessage.error(result.message);
      }
    },
    async refreshCaptcha() {
      const result = await this.$store.dispatch('fetchCaptcha');
      if (result.success) {
        this.captchaSvg = this.$store.state.captchaSvg;
        this.captchaId = this.$store.state.captchaId;
      }
    },
    resetForms() {
      this.loginForm = { email: '', password: '', captchaCode: '' };
      this.registerForm = { name: '', email: '', password: '' };
      this.captchaSvg = null;
      this.captchaId = null;
      this.$refs.loginFormRef?.resetFields();
      this.$refs.registerFormRef?.resetFields();
    }
  }
};
</script>
