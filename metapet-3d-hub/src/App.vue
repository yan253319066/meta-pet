<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/market">Market</router-link>
      <router-link to="/pets">Virtual 3D Pets</router-link>
      <router-link to="/profile">Personal</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
// No specific script setup needed for App.vue in this basic setup
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 4px;
}

nav a.router-link-exact-active {
  color: #fff;
  background-color: #007bff;
}

nav a:hover {
  background-color: #e9ecef;
}
</style>
