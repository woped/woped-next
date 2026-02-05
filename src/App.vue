<script setup>
import PetriNetEditor from './components/editor/PetriNetEditor.vue'
</script>

<template>
  <PetriNetEditor />
</template>

<style>
/* Reset styles for full-screen editor */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
