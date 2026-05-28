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
      loginForm: { email: '', password: '' },
      registerForm: { name: '', email: '', password: '' },
      loginLoading: false,
      registerLoading: false,
      loginRules: {
        email: [
          { required: true, message: 'Email is required', trigger: 'blur' },
          { type: 'email', message: 'Invalid email format', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Password is required', trigger: 'blur' },
          { min: 6, message: 'Min 6 characters', trigger: 'blur' }
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
  methods: {
    async handleLogin() {
      const valid = await this.$refs.loginFormRef.validate().catch(() => false);
      if (!valid) return;

      this.loginLoading = true;
      const result = await this.$store.dispatch('login', {
        email: this.loginForm.email,
        password: this.loginForm.password
      });
      this.loginLoading = false;

      if (result.success) {
        ElMessage.success('Login successful');
        this.$emit('update:modelValue', false);
        this.resetForms();
        window.location.reload();
      } else {
        ElMessage.error(result.message);
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
    resetForms() {
      this.loginForm = { email: '', password: '' };
      this.registerForm = { name: '', email: '', password: '' };
      this.$refs.loginFormRef?.resetFields();
      this.$refs.registerFormRef?.resetFields();
    }
  }
};
</script>
