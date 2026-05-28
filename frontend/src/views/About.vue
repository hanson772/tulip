<template>
  <div class="about">
    <h1>About MyApp</h1>
    <p>This is a full-stack application built with Node.js, Express, Vue 3, and MongoDB.</p>
    <p>Features include user authentication with JWT and a responsive UI built with Element Plus.</p>
  </div>
</template>

<script>
export default {
  name: 'AboutView'
}
</script>

<style scoped>
.about {
  padding: 2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.about p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
}
</style>
