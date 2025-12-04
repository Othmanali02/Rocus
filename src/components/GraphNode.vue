<template>
	<div class="w-screen h-screen relative overflow-hidden font-sans transition-all duration-300"
		:class="isDarkMode ? 'bg-[#212121]' : 'bg-[#f4f4f4]'">
		<div class="fixed top-0 left-0 right-0 z-[1000] px-5 py-4"
			:class="isDarkMode ? 'dark:bg-[#212121]' : 'dark:bg-[#f4f4f4]'">
			<div class="flex items-center justify-between max-w-screen-2xl mx-auto">
				<div class="flex items-center gap-4">
					<a href="/" class="flex items-center">
						<img v-if="isDarkMode" src="./images/RocusBlue.png" alt="Rocus" class="h-10 w-auto" />
						<img v-else src="./images/RocusBlue.png" alt="Rocus" class="h-10 w-auto" />
					</a>
				</div>

				<div class="flex-1 max-w-2xl mx-8">
					<div class="relative">
						<button @click.stop="toggleAlbumsDropdown"
							class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border hover:border-[#4A90E2] transition-all duration-200 group"
							:class="isDarkMode
								? 'dark:bg-black dark:text-gray-500 dark:border-gray-800'
								: 'dark:bg-[#f4f4f4] dark:text-gray-400 dark:border-gray-200'
								">
							<div class="flex items-center gap-3">
								<span class="text-2xl">{{ currentAlbum?.icon || "📁" }}</span>

								<div class="text-left">
									<div class="text-sm font-semibold"
										:class="isDarkMode ? 'dark:text-white' : 'text-gray-700'">
										{{ currentAlbum?.name || "All Clusters" }}
									</div>
									<!-- <div class="text-xs text-gray-500 dark:text-gray-400">
										{{
											graphData?.nodes?.length ||
											0
										}}
										clusters
									</div> -->
								</div>
							</div>
							<svg class="w-5 h-5 text-gray-400 group-hover:text-[#4A90E2] transition-transform duration-200"
								:class="{ 'rotate-180': showAlbumsDropdown }" fill="none" stroke="currentColor"
								viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						<div v-if="showAlbumsDropdown"
							class="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fadeIn"
							:class="isDarkMode
								? 'dark:bg-black dark:border-gray-800'
								: 'bg-white border-gray-200 text-gray-700'
								">
							<button @click="selectAlbum(null)"
								class="w-full flex items-center gap-3 px-4 py-3 text-gray-100 transition-colors" :class="{
									'bg-[#4A90E2]/10': !currentAlbum,
									'dark:hover:bg-[#212121]': isDarkMode,
									'hover:bg-[#f4f4f4]': !isDarkMode,
								}">
								<span class="text-2xl">🌐</span>
								<div class="flex-1 text-left">
									<div class="text-sm font-medium"
										:class="isDarkMode ? 'dark:text-white' : 'text-gray-900'">
										All Clusters
									</div>
									<div class="text-xs text-gray-500">View</div>
								</div>
								<svg v-if="!currentAlbum" class="w-5 h-5 text-[#4A90E2]" fill="currentColor"
									viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd" />
								</svg>
							</button>

							<div class="h-px mx-4" :class="isDarkMode ? 'dark:bg-gray-800' : 'bg-gray-200'"></div>

							<div class="max-h-64 overflow-y-auto">
								<button v-for="album in albums" :key="album.id" @click="selectAlbum(album)"
									class="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#4A90E2] transition-colors group"
									:class="{
										'bg-[#4A90E2]/10': currentAlbum?.id === album.id,
										'dark:hover:bg-[#212121]': isDarkMode,
										'hover:bg-[#f4f4f4]': !isDarkMode,
									}">
									<span class="text-2xl">{{ album.icon }}</span>
									<div class="flex-1 text-left">
										<div class="text-sm font-medium"
											:class="isDarkMode ? 'dark:text-white' : 'text-gray-900 '">
											{{ album.name }}
										</div>
										<!-- <div class="text-xs text-gray-500">
											{{ album.cluster_ids?.length || 0 }} clusters
										</div> -->
									</div>
									<div class="flex items-center gap-2">
										<svg v-if="currentAlbum?.id === album.id" class="w-5 h-5 text-[#4A90E2]"
											fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd" />
										</svg>
										<button @click.stop="editAlbum(album)"
											class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
											<svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none"
												stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button @click.stop="deleteAlbum(album)"
											class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
											<svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none"
												stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</button>
							</div>

							<div class="h-px mx-4" :class="isDarkMode ? 'dark:bg-gray-800' : 'bg-gray-200'"></div>

							<button @click="createNewAlbum"
								class="w-full flex items-center gap-3 px-4 py-3 transition-colors text-[#4A90E2] font-medium"
								:class="isDarkMode ? ' dark:hover:bg-[#212121]' : 'hover:bg-[#f4f4f4]'
									">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M12 4v16m8-8H4" />
								</svg>
								<span class="text-sm">Create New Album</span>
							</button>
						</div>
					</div>



					<div class="fixed top-24 left-1/2 transform -translate-x-1/2  transition-all duration-300"
						:class="{ 'scale-105': isSearchFocused }">
						<div @click="focusSearch"
							class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 cursor-text group"
							:class="isSearchFocused
								? (isDarkMode
									? 'bg-black/90 focus:outline-none'
									: 'bg-[#ffffff] focus:outline-none')
								: (isDarkMode
									? 'bg-[#212121] hover:bg-black/60'
									: 'bg-[#f4f4f4] hover:bg-white/60')
								">

							<!-- Search Icon -->
							<svg class="w-5 h-5 transition-colors duration-200" :class="isSearchFocused
								? 'text-blue-500'
								: (isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600')"
								fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>

							<!-- Input Field -->
							<input ref="searchInputRef" v-model="searchInput" @input="performSearch"
								@focus="isSearchFocused = true" @blur="handleSearchBlur" type="text"
								placeholder="Search clusters, websites, domains..."
								class="bg-transparent border-none focus:outline-none focus:ring-0 outline-none w-80 placeholder-gray-400 transition-all duration-200"
								:class="isDarkMode ? 'text-white focus:outline-none' : 'text-gray-900 focus:outline-none'" />

							<!-- Clear Button -->
							<button v-if="searchInput" @click="clearSearch"
								class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 flex-shrink-0">
								<svg class="w-4 h-4" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
									fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd" />
								</svg>
							</button>

							<!-- ESC Hint (shown when not focused) -->
							<div class="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 flex-shrink-0"
								:class="isDarkMode
									? 'bg-gray-800/80 border border-gray-700/50'
									: 'bg-gray-200/80 border border-gray-300/50'">
								<span class="text-xs font-medium tracking-wider"
									:class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
									ESC
								</span>
							</div>

							<!-- Match Counter -->
							<div v-if="matchCount > 0"
								class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex-shrink-0"
								:class="isDarkMode
									? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
									: 'bg-blue-100 text-blue-700 border border-blue-200'">
								{{ matchCount }}
							</div>
						</div>
					</div>

				</div>



				<div class="flex items-center gap-3">
					<button @click="toggleSettings" class="p-2.5 rounded-xl transition-all" :class="isDarkMode
						? 'dark:bg-black hover:bg-gray-100 dark:hover:bg-[#212121]'
						: 'bg-white'
						">
						<svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
							viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</button>

					<button @click="toggleModelStatus" class="relative p-2.5 rounded-xl transition-all" :class="isDarkMode
						? 'dark:bg-black hover:bg-gray-100 dark:hover:bg-[#212121]'
						: 'bg-white'
						">
						<!-- Loading state with spinner -->
						<svg v-if="modelLoading" class="w-5 h-5 text-[#4A90E2] animate-spin" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<!-- Ready state with checkmark -->
						<svg v-else-if="!error" class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						<!-- Error state -->
						<svg v-else class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<!-- Ready indicator badge -->
						<div v-if="!modelLoading && !error"
							class="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-black">
						</div>
						<!-- Processing indicator badge -->
						<div v-if="processingQueue.length > 0"
							class="absolute top-1 right-1 w-2 h-2 bg-[#4A90E2] rounded-full border-2 border-white dark:border-black animate-pulse">
						</div>
					</button>

					<button @click="handleProfileClick" class="p-2.5 rounded-xl transition-all" :class="isDarkMode
						? 'dark:bg-black hover:bg-gray-100 dark:hover:bg-[#212121]'
						: 'bg-white'
						">
						<svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor"
							viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<div v-if="isLoading"
			class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[3000] flex items-center justify-center">
			<div
				class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center shadow-2xl max-w-sm">
				<div
					class="w-16 h-16 mx-auto mb-6 border-4 border-gray-200 dark:border-gray-800 border-t-[#4A90E2] rounded-full animate-spin">
				</div>
				<p class="text-lg font-medium text-gray-700 dark:text-gray-300">
					Loading clusters...
				</p>
			</div>
		</div>

		<div v-if="showAlbumModal" @click="closeAlbumModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :class="isDarkMode
				? 'dark:bg-black dark:border-gray-800'
				: 'bg-white border-gray-200'
				">
				<h3 class="text-2xl font-bold mb-6" :class="isDarkMode ? 'dark:text-white' : 'text-gray-900'">
					{{ editingAlbum ? "Edit Album" : "Create New Album" }}
				</h3>

				<div class="space-y-5">
					<div>
						<label class="block text-sm font-medium mb-2"
							:class="isDarkMode ? 'dark:text-gray-300' : 'text-gray-700'">Album Name</label>
						<input v-model="albumForm.name" type="text" placeholder="My Collection"
							class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none transition-all"
							:class="isDarkMode
								? 'dark:bg-[#212121] dark:border-gray-800 dark:text-white'
								: 'bg-[#f4f4f4] border-gray-200 text-gray-900'
								" />
					</div>

					<div>
						<label class="block text-sm font-medium mb-2"
							:class="isDarkMode ? 'dark:text-gray-300' : 'text-gray-700'">Icon</label>
						<div class="flex gap-2">
							<button v-for="(icon, index) in iconOptions" :key="icon" @click="albumForm.icon = icon"
								class="p-3 rounded-xl transition-all" :class="{
									'bg-[#4A90E2]/20 ring-2 ring-[#4A90E2]':
										albumForm.icon === icon,
									'dark:hover:bg-[#212121]': isDarkMode,
									'hover:bg-[#f4f4f4]': !isDarkMode,
								}">
								<img :src="iconUrls[index]" alt="icon" class="w-8 h-8 object-contain" />
							</button>
						</div>
					</div>
				</div>

				<div class="flex gap-3 mt-8">
					<button @click="closeAlbumModal" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:class="isDarkMode
							? 'dark:text-gray-300 dark:bg-[#212121] dark:hover:bg-gray-700'
							: 'text-gray-700 bg-[#f4f4f4] hover:bg-gray-200'
							">
						Cancel
					</button>
					<button @click="saveAlbum"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all shadow-lg shadow-[#4A90E2]/30">
						{{ editingAlbum ? "Save" : "Create" }}
					</button>
				</div>
			</div>
		</div>

		<div v-if="showSettings" @click="closeSettings"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto"
				:class="isDarkMode
					? 'dark:bg-black dark:border-gray-800'
					: 'bg-white border-gray-200'
					">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-2xl font-bold" :class="isDarkMode ? ' dark:text-white' : 'text-gray-900'">
						Settings
					</h3>
					<button @click="closeSettings" class="p-2 rounded-xl transition-all" :class="isDarkMode ? 'dark:hover:bg-[#212121]' : 'hover:bg-[#f4f4f4]'
						">
						<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<div>
							<div class="font-medium" :class="isDarkMode ? 'dark:text-white' : ' text-gray-900 '">
								Dark Mode
							</div>
							<div class="text-sm text-gray-500">Toggle dark theme</div>
						</div>
						<button @click="toggleDarkMode" class="relative w-14 h-8 rounded-full transition-all"
							:class="isDarkMode ? 'bg-[#4A90E2]' : 'bg-gray-300'">
							<div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
								:class="{ 'translate-x-6': isDarkMode }"></div>
						</button>
					</div>

					<!-- <div>
						<div class="flex items-center justify-between mb-2">
							<div class="font-medium text-gray-900 dark:text-white">
								Node Size
							</div>
							<span class="text-sm text-gray-500"
								>{{ settings.nodeSize }}x</span
							>
						</div>
						<input
							type="range"
							min="0.5"
							max="2"
							step="0.1"
							v-model="settings.nodeSize"
							@input="updateNodeSizes"
							class="w-full h-2 bg-[#f4f4f4] dark:bg-[#212121] rounded-lg appearance-none cursor-pointer slider"
						/>
					</div> -->

					<!-- <div>
						<div class="flex items-center justify-between mb-2">
							<div class="font-medium" :class="isDarkMode ? 'dark:text-white' : 'text-gray-900'">
								Animation Speed
							</div>
							<span class="text-sm text-gray-500">{{ settings.animationSpeed }}x</span>
						</div>
						<input type="range" min="0.1" max="2" step="0.1" v-model="settings.animationSpeed"
							class="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
							:class="isDarkMode ? 'dark:bg-[#212121]' : 'bg-[#f4f4f4]'" />
					</div> -->

					<div class="flex items-center justify-between">
						<div>
							<div class="font-medium" :class="isDarkMode ? 'dark:text-white' : ' text-gray-900 '">
								Show Connections
							</div>
							<div class="text-sm text-gray-500">Display cluster links</div>
						</div>
						<button @click="
							showConnections = !showConnections;
						toggleConnections();
						" class="relative w-14 h-8 rounded-full transition-all"
							:class="showConnections ? 'bg-[#4A90E2]' : 'bg-gray-300'">
							<div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
								:class="{ 'translate-x-6': showConnections }"></div>
						</button>
					</div>

					<!-- <div>
						<div class="flex items-center justify-between mb-2">
							<div class="font-medium text-gray-900 dark:text-white">
								Similarity Threshold
							</div>
							<span class="text-sm text-gray-500">{{
								settings.similarityThreshold
							}}</span>
						</div>
						<input
							type="range"
							min="0.3"
							max="0.9"
							step="0.05"
							v-model="settings.similarityThreshold"
							@input="updateConnections"
							class="w-full h-2 bg-[#f4f4f4] dark:bg-[#212121] rounded-lg appearance-none cursor-pointer slider"
						/>
					</div> -->
				</div>

				<button @click="resetSettings" class="w-full mt-8 px-6 py-3 rounded-xl font-medium transition-all"
					:class="isDarkMode
						? 'dark:bg-[#212121] dark:text-gray-300 dark:hover:bg-gray-700'
						: 'bg-[#f4f4f4] text-gray-700 hover:bg-gray-200'
						">
					Reset to Default
				</button>
			</div>
		</div>

		<div class="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3">
			<button @click="resetView" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border group"
				:class="isDarkMode
					? 'dark:bg-[#212121] dark:text-gray-300 dark:hover:bg-gray-700'
					: 'bg-[#f4f4f4] text-gray-700 hover:bg-gray-200'
					">
				<svg class="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-[#4A90E2] transition-colors"
					fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
				</svg>
			</button>
			<button @click="refreshData" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border group"
				:class="isDarkMode
					? 'dark:bg-[#212121] dark:text-gray-300 dark:hover:bg-gray-700'
					: 'bg-[#f4f4f4] text-gray-700 hover:bg-gray-200'
					">
				<svg class="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-[#4A90E2] transition-colors"
					fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
			<button v-if="explodedNode" @click="collapseNode"
				class="p-4 bg-[#4A90E2] text-white rounded-2xl shadow-lg hover:shadow-xl hover:bg-[#357ABD] transition-all">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div id="graph-container" ref="graphContainer" @click="handleBackgroundClick"
			class="w-full h-full pt-20 cursor-grab active:cursor-grabbing"></div>

		<div ref="tooltip"
			class="fixed pointer-events-none opacity-0 transition-opacity duration-200 z-[2000] px-4 py-3 bg-black/95 dark:bg-white/95 text-white dark:text-black text-sm rounded-xl shadow-xl max-w-xs backdrop-blur-sm">
		</div>

		<!-- Context Menu -->
		<div v-if="showContextMenu" :style="contextMenuStyle" @click.stop
			class="fixed z-[2500] rounded-xl shadow-2xl border overflow-hidden min-w-[200px] animate-scaleIn"
			:class="isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'">

			<button @click="renameCluster" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:class="isDarkMode ? 'hover:bg-gray-900 text-gray-300' : 'hover:bg-gray-50 text-gray-700'">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
				<span class="text-sm font-medium">Rename Cluster</span>
			</button>

			<button @click="showAddWebsitesModal" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:class="isDarkMode ? 'hover:bg-gray-900 text-gray-300' : 'hover:bg-gray-50 text-gray-700'">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				<span class="text-sm font-medium">Add Websites</span>
			</button>

			<button @click="showRemoveWebsitesModal" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:class="isDarkMode ? 'hover:bg-gray-900 text-gray-300' : 'hover:bg-gray-50 text-gray-700'">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span class="text-sm font-medium">Remove Websites</span>
			</button>

			<div class="h-px mx-2" :class="isDarkMode ? 'bg-gray-800' : 'bg-gray-200'"></div>

			<button @click="deleteCluster"
				class="w-full flex items-center gap-3 px-4 py-3 transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				<span class="text-sm font-medium">Delete Cluster</span>
			</button>
		</div>

		<!-- Rename Modal -->
		<div v-if="showRenameModal" @click="closeRenameModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn border"
				:class="isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'">
				<h3 class="text-2xl font-bold mb-6" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
					Rename Cluster
				</h3>
				<input v-model="renameInput" @keyup.enter="confirmRename" type="text" placeholder="New cluster name"
					class="w-full px-4 py-3 border rounded-xl outline-none transition-all"
					:class="isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'" />
				<div class="flex gap-3 mt-6">
					<button @click="closeRenameModal" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:class="isDarkMode ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
						Cancel
					</button>
					<button @click="confirmRename"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all">
						Rename
					</button>
				</div>
			</div>
		</div>

		<!-- Add Websites Modal -->
		<div v-if="showAddWebsites" @click="closeAddWebsitesModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn border max-h-[80vh] overflow-y-auto"
				:class="isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'">
				<h3 class="text-2xl font-bold mb-6" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
					Add Websites to Cluster
				</h3>
				<div class="space-y-2 mb-6">
					<div v-for="website in availableWebsites" :key="website.id"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors" :class="selectedWebsitesToAdd.includes(website.id)
							? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
							: isDarkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'"
						@click="toggleWebsiteSelection(website.id)">
						<input type="checkbox" :checked="selectedWebsitesToAdd.includes(website.id)" class="w-4 h-4" />
						<div class="flex-1">
							<div class="font-medium" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
								{{ website.title }}
							</div>
							<div class="text-sm text-gray-500">{{ website.domain }}</div>
						</div>
					</div>
				</div>
				<div class="flex gap-3">
					<button @click="closeAddWebsitesModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:class="isDarkMode ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
						Cancel
					</button>
					<button @click="confirmAddWebsites"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all">
						Add Selected
					</button>
				</div>
			</div>
		</div>

		<!-- Remove Websites Modal -->
		<div v-if="showRemoveWebsites" @click="closeRemoveWebsitesModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn border max-h-[80vh] overflow-y-auto"
				:class="isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'">
				<h3 class="text-2xl font-bold mb-6" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
					Remove Websites from Cluster
				</h3>
				<div class="space-y-2 mb-6">
					<div v-for="websiteId in contextCluster?.websites" :key="websiteId"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors" :class="selectedWebsitesToRemove.includes(websiteId)
							? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
							: isDarkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'"
						@click="toggleRemoveSelection(websiteId)">
						<input type="checkbox" :checked="selectedWebsitesToRemove.includes(websiteId)"
							class="w-4 h-4" />
						<div class="flex-1">
							<div class="font-medium" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
								{{ websites[websiteId]?.title }}
							</div>
							<div class="text-sm text-gray-500">{{ websites[websiteId]?.domain }}</div>
						</div>
					</div>
				</div>
				<div class="flex gap-3">
					<button @click="closeRemoveWebsitesModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:class="isDarkMode ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
						Cancel
					</button>
					<button @click="confirmRemoveWebsites"
						class="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all">
						Remove Selected
					</button>
				</div>
			</div>
		</div>

		<div v-if="selectedWebsite" :style="stickyNoteStyle" @click.stop
			class="fixed z-[1500] rounded-2xl shadow-2xl min-w-[320px] max-w-md animate-scaleIn"
			:class="isDarkMode ? 'dark:bg-yellow-200' : 'bg-yellow-100'">
			<div @mousedown="startDraggingSticky" class="flex justify-between items-center p-4 cursor-move border-b"
				:class="isDarkMode ? 'dark:border-yellow-300' : 'border-yellow-200'">
				<h4 class="font-semibold text-base truncate pr-4"
					:class="isDarkMode ? 'text-gray-900' : 'text-gray-900'">
					{{ selectedWebsite.title }}
				</h4>

				<button @click="closeStickyNote" class="p-1.5 rounded-lg transition-all flex-shrink-0" :class="isDarkMode ? 'dark:hover:bg-yellow-300' : 'hover:bg-yellow-200'
					">
					<svg class="w-5 h-5" :class="isDarkMode ? 'text-gray-800' : 'text-gray-700'" fill="none"
						stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-4 space-y-3 text-sm" :class="isDarkMode ? 'text-gray-900' : 'text-gray-800'">
				<div>
					<span class="font-semibold">Cluster ID:</span>
					{{ selectedWebsite.parentCluster }}
				</div>

				<div>
					<span class="font-semibold">Domain:</span>
					{{ selectedWebsite.domain }}
				</div>

				<div v-if="websiteDetails">
					<span class="font-semibold">Description:</span>
					{{ websiteDetails.ai_summary || "None" }}
				</div>

				<a :href="selectedWebsite.url" target="_blank"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all" :class="isDarkMode
						? 'bg-[#333] hover:bg-black text-white'
						: 'bg-[#212121] hover:bg-black text-white'
						">
					🔗 Visit Website
				</a>

				<div v-if="selectedWebsite.processed_at" class="text-xs"
					:class="isDarkMode ? 'text-gray-700' : 'text-gray-600'">
					<span class="font-semibold">Processed:</span>
					{{ formatDate(selectedWebsite.processed_at) }}
				</div>
			</div>
		</div>

		<div v-if="showDiscoverModal" @click="closeDiscoverModal"
			class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto border"
				:class="isDarkMode
					? 'dark:bg-black dark:border-gray-800'
					: 'bg-white border-gray-200'
					">
				<div class="flex justify-between items-center mb-6">
					<div>
						<h3 class="text-2xl font-bold" :class="isDarkMode ? 'dark:text-white' : 'text-gray-900'">
							Discover Similar Websites
						</h3>
						<p class="text-sm mt-1" :class="isDarkMode ? 'dark:text-gray-400' : 'text-gray-500'">
							Found {{ similarWebsites.length }} websites related to
							<strong>{{ explodedNode?.topic }}</strong>
						</p>
					</div>

					<button @click="closeDiscoverModal" class="p-2 rounded-xl transition-all" :class="isDarkMode ? 'dark:hover:bg-[#212121]' : 'hover:bg-[#f4f4f4]'
						">
						<svg class="w-6 h-6" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Loading State -->
				<div v-if="isLoadingSimilar" class="flex flex-col items-center justify-center py-16">
					<div class="w-12 h-12 border-4 border-t-[#4A90E2] rounded-full animate-spin mb-4"
						:class="isDarkMode ? 'dark:border-gray-800' : 'border-gray-200'"></div>

					<p :class="isDarkMode ? 'dark:text-gray-400' : 'text-gray-600'">
						Searching the web...
					</p>
				</div>

				<!-- Results -->
				<div v-else-if="similarWebsites.length > 0" class="space-y-3">
					<button v-for="(website, index) in similarWebsites" :key="index"
						@click="openExternalLink(website.url)"
						class="w-full flex items-start gap-4 p-4 rounded-2xl transition-all group border" :class="isDarkMode
							? 'dark:bg-[#212121] dark:hover:bg-[#333] dark:text-gray-300 dark:border-transparent'
							: 'bg-[#f4f4f4] hover:bg-gray-200 border-transparent text-gray-700'
							">
						<div class="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-[#4A90E2]"
							:class="isDarkMode ? 'dark:bg-black' : 'bg-white'">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						</div>

						<div class="flex-1 min-w-0 text-left">
							<h4 class="font-semibold truncate"
								:class="isDarkMode ? 'dark:text-white' : 'text-gray-900'">
								{{ website.title }}
							</h4>

							<p class="text-xs mt-1 truncate text-[#4A90E2]">
								{{ website.domain || new URL(website.url).hostname }}
							</p>

							<p class="text-sm mt-2 line-clamp-2"
								:class="isDarkMode ? 'dark:text-gray-400' : 'text-gray-600'">
								{{
									website.snippet ||
									website.description ||
									"No description available"
								}}
							</p>
						</div>

						<svg class="w-5 h-5 flex-shrink-0 transition-all group-hover:translate-x-1" :class="isDarkMode
							? 'dark:text-gray-400 group-hover:text-[#4A90E2]'
							: 'text-gray-400 group-hover:text-[#4A90E2]'
							" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
					</button>
				</div>

				<!-- No results -->
				<div v-else class="flex flex-col items-center justify-center py-16">
					<svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<circle cx="11" cy="11" r="8" stroke-width="2"></circle>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35" />
					</svg>

					<p :class="isDarkMode ? 'dark:text-gray-400' : 'text-gray-500'">
						No similar websites found
					</p>
				</div>
			</div>
		</div>

		<!-- <div
			v-if="connectionStatus !== 'hidden'"
			class="fixed top-24 right-8 z-[1000] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-sm animate-slideInRight"
			:class="{
				'bg-gradient-to-r from-green-500 to-green-600 text-white':
					connectionStatus === 'connected',
				'bg-gradient-to-r from-red-500 to-red-600 text-white':
					connectionStatus === 'disconnected',
				'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white':
					connectionStatus === 'connecting',
			}"
		>
			<div class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
			<span v-if="connectionStatus === 'connected'">Connected</span>
			<span v-else-if="connectionStatus === 'connecting'">Connecting...</span>
			<span v-else>Disconnected</span>
		</div> -->

		<div v-if="showNewDataNotification"
			class="fixed bottom-24 right-8 z-[1000] px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl flex items-center gap-4 font-semibold animate-slideInUp">
			<div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
				</svg>
			</div>
			<span>New clusters detected! Updating graph...</span>
		</div>

		<div :class="[
			'fixed bottom-8 left-8 z-[1000] px-4 py-2 backdrop-blur-xl rounded-xl text-xs border',
			isDarkMode
				? 'bg-black/80 text-gray-400 border-gray-800'
				: 'bg-white/80 text-gray-600 border-gray-200',
		]">
			Mouse wheel to zoom • Click and drag to pan • Click clusters to explode
		</div>
	</div>
</template>

<script setup>
import {
	ref,
	reactive,
	onMounted,
	onBeforeUnmount,
	watch,
	onUnmounted,
	computed,
} from "vue";
import axios from "axios";
import * as d3 from "d3";
import { pipeline, env } from "@xenova/transformers";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

// configuring transformers.js (embeddings)
env.allowLocalModels = false;
env.useBrowserCache = true;

const modelLoading = ref(false);
const loadingMessage = ref("");
const downloadProgress = ref(0);
const error = ref("");
const platform = ref("");
const searchInput = ref('');
const matchCount = ref(0);
const isSearchFocused = ref(false);
const searchInputRef = ref(null);

// Data stores
const clusters = ref({});
const websites = ref({});
const embeddings = ref({}); // Store embeddings separately for cosine similarity

const processingQueue = ref([]);
const processedCount = ref(0);
const isProcessing = ref(false);

// Models
let embeddingModel = null; // transformers.js embedding model (MiniLM)
let summarizationModel = null; // will point to the Web-LLM engine (chat-style)
let db = null;

const SIMILARITY_THRESHOLD = 0.65;
const LOOSE_SIMILARITY_THRESHOLD = 0.45;

const queueProgress = computed(() => {
	if (processingQueue.value.length === 0) return 0;
	return (processedCount.value / processingQueue.value.length) * 100;
});

// Graph information

const graphContainer = ref(null);
const tooltip = ref(null);
const showSettings = ref(false);
const isDarkMode = ref(false);
const selectedWebsite = ref(null);
const stickyNoteStyle = ref({});
const isLoading = ref(false);
const websiteDetails = ref(null);
const explodedNode = ref(null);
const showDiscoverModal = ref(false);
const isLoadingSimilar = ref(false);
const similarWebsites = ref([]);
const showContextMenu = ref(false);
const contextMenuStyle = ref({});
const contextCluster = ref(null);
const showRenameModal = ref(false);
const renameInput = ref('');
const showAddWebsites = ref(false);
const showRemoveWebsites = ref(false);
const selectedWebsitesToAdd = ref([]);
const selectedWebsitesToRemove = ref([]);

const availableWebsites = computed(() => {
	if (!contextCluster.value) return [];

	const currentAlbumId = contextCluster.value.album_id;
	const clusterWebsiteIds = new Set(contextCluster.value.websites);

	return Object.values(websites.value).filter(website =>
		website.album_id === currentAlbumId && !clusterWebsiteIds.has(website.id)
	);
});

// Albums state
const albums = ref([]);
const currentAlbum = ref(null);
const showAlbumsDropdown = ref(false);
const showAlbumModal = ref(false);
const editingAlbum = ref(null);
const albumForm = reactive({
	name: "",
	icon: "RocusFileIcon.png",
});
const showModelStatus = ref(false);

const emojiOptions = [
	"RocusFileIcon.png",
	"RocuseFileIconColored.png",
	"RocuseFileIconDark.png",
];

const iconUrls = emojiOptions.map(
	(icon) => new URL(`./images/${icon}`, import.meta.url).href
);

const wsConnection = ref(null); // web-socket not needed anymore
const connectionStatus = ref("disconnected"); // web-socket not needed anymore
const showNewDataNotification = ref(false);
let reconnectTimeout = null; // web-socket not needed anymore
let reconnectAttempts = 0; // web-socket not needed anymore
const MAX_RECONNECT_ATTEMPTS = 5; // web-socket not needed anymore

const settings = reactive({
	nodeSize: 1.0,
	animationSpeed: 1.0,
	similarityThreshold: 0.5,
});

let graphData;
let rawClusters = [];
let rawSimilarities = {};
let simulation;
let showConnections = ref(true);
let searchTerm = "";
let svg, container, zoom;
let websiteNodes = [];

// Sticky note dragging
let isDraggingSticky = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const API_BASE_URL = "http://localhost:5000"; // no longer need the backend

axios.defaults.withCredentials = true; // no longer need cookies
axios.defaults.baseURL = API_BASE_URL; // no longer need ts


const handleKeyDown = (event) => {
	if (event.key === 'Escape') {
		event.preventDefault();
		if (isSearchFocused.value) {
			// If already focused, blur and clear
			searchInputRef.value?.blur();
			searchInput.value = '';
			isSearchFocused.value = false;
		} else {
			// If not focused, focus the search
			focusSearch();
		}
	}
};

// Focus search function
const focusSearch = () => {
	isSearchFocused.value = true;
	setTimeout(() => {
		searchInputRef.value?.focus();
	}, 0);
};

// Handle search blur
const handleSearchBlur = () => {
	setTimeout(() => {
		if (searchInput.value === '') {
			isSearchFocused.value = false;
		}
	}, 150);
};

// Handle click outside
const handleClickOutside = (event) => {
	const searchContainer = event.target.closest('.fixed.top-24');
	if (!searchContainer && isSearchFocused.value && !searchInput.value) {
		isSearchFocused.value = false;
	}
};

// Clear search
const clearSearch = () => {
	searchInput.value = '';
	matchCount.value = 0;
	performSearch();
	focusSearch();
};




async function fetchAlbums() {
	try {
		if (!db) return {};

		const tx = db.transaction("albums", "readonly");

		const store = tx.objectStore("albums");

		const request = store.getAll();

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				const albumsData = {};

				for (const album of request.result) {
					albumsData[album.id] = album;
				}

				albums.value = albumsData;

				resolve(albumsData);
			};

			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.error("❌ Error fetching albums:", error);

		return {};
	}
}

async function createAlbum(albumData) {
	try {
		if (!db) throw new Error("Database not initialized");

		const albumId = generateId();

		const album = {
			id: albumId,

			...albumData,

			created_at: new Date().toISOString(),
		};

		const tx = db.transaction("albums", "readwrite");

		const store = tx.objectStore("albums");

		await new Promise((resolve, reject) => {
			const request = store.put(album);

			request.onsuccess = resolve;

			request.onerror = () => reject(request.error);
		});

		await fetchAlbums();

		return { success: true, album };
	} catch (error) {
		console.error("❌ Error creating album:", error);

		throw error;
	}
}

async function updateAlbum(albumId, albumData) {
	try {
		if (!db) throw new Error("Database not initialized");

		const tx = db.transaction("albums", "readwrite");

		const store = tx.objectStore("albums");

		const existingAlbum = await new Promise((resolve, reject) => {
			const request = store.get(albumId);

			request.onsuccess = () => resolve(request.result);

			request.onerror = () => reject(request.error);
		});

		const updatedAlbum = {
			...existingAlbum,

			...albumData,

			id: albumId,

			updated_at: new Date().toISOString(),
		};

		await new Promise((resolve, reject) => {
			const request = store.put(updatedAlbum);

			request.onsuccess = resolve;

			request.onerror = () => reject(request.error);
		});

		await fetchAlbums();

		return { success: true, album: updatedAlbum };
	} catch (error) {
		console.error("❌ Error updating album:", error);

		throw error;
	}
}

async function deleteAlbumById(albumId) {
	try {
		if (!db) throw new Error("Database not initialized");

		const tx = db.transaction("albums", "readwrite");

		const store = tx.objectStore("albums");

		await new Promise((resolve, reject) => {
			const request = store.delete(albumId);

			request.onsuccess = resolve;

			request.onerror = () => reject(request.error);
		});

		await fetchAlbums();

		if (currentAlbum.value?.id === albumId) {
			currentAlbum.value = null;
		}

		return { success: true };
	} catch (error) {
		console.error("❌ Error deleting album:", error);

		throw error;
	}
}

function toggleAlbumsDropdown() {
	showAlbumsDropdown.value = !showAlbumsDropdown.value;
	console.log(showAlbumsDropdown.value);
}

function selectAlbum(album) {
	currentAlbum.value = album;
	showAlbumsDropdown.value = false;

	console.log(albums.value)
	console.log("Selected album:", album?.name || "All Clusters");

	// Reload everything with new filter
	loadData().then(() => {
		if (simulation) {
			simulation.nodes(graphData.nodes);
			simulation.force("link").links(graphData.links);
			simulation.alpha(1).restart();
			renderGraph();
		}
	});
}

function toggleModelStatus() {
	showModelStatus.value = !showModelStatus.value;
}

function closeModelStatus() {
	showModelStatus.value = false;
}

// function filterGraphByAlbum() {
// 	if (!currentAlbum.value) {
// 		// Show all clusters
// 		graphData = processApiData(rawClusters, rawSimilarities);
// 	} else {
// 		// Filter clusters by album
// 		const albumClusterIds = currentAlbum.value.cluster_ids || [];
// 		const filteredClusters = rawClusters.filter((cluster) =>
// 			albumClusterIds.includes(cluster.cluster_id)
// 		);
// 		graphData = processApiData(filteredClusters, rawSimilarities);
// 	}

// 	if (simulation) {
// 		simulation.nodes(graphData.nodes);
// 		simulation.force("link").links(graphData.links);
// 		simulation.alpha(1).restart();
// 		renderGraph();
// 	}
// }

function createNewAlbum() {
	editingAlbum.value = null;
	albumForm.name = "";
	albumForm.icon = "📁";
	showAlbumModal.value = true;
	showAlbumsDropdown.value = false;
}

function editAlbum(album) {
	editingAlbum.value = album;
	albumForm.name = album.name;
	albumForm.icon = album.icon;
	showAlbumModal.value = true;
	showAlbumsDropdown.value = false;
}

async function saveAlbum() {
	if (!albumForm.name.trim()) return;

	try {
		const albumData = {
			name: albumForm.name.trim(),
			icon: albumForm.icon,
			cluster_ids: editingAlbum.value?.cluster_ids || [],
		};

		if (editingAlbum.value) {
			await updateAlbum(editingAlbum.value.id, albumData);
		} else {
			await createAlbum(albumData);
		}

		closeAlbumModal();
	} catch (error) {
		console.error("Error saving album:", error);
		alert("Failed to save album. Please try again.");
	}
}

async function deleteAlbum(album) {
	if (!confirm(`Are you sure you want to delete "${album.name}"?`)) return;

	try {
		await deleteAlbumById(album.id);
	} catch (error) {
		console.error("Error deleting album:", error);
		alert("Failed to delete album. Please try again.");
	}
}

function closeAlbumModal() {
	showAlbumModal.value = false;
	editingAlbum.value = null;
	albumForm.name = "";
	albumForm.icon = "📁";
}

async function fetchClusters() {
	try {
		if (!db) return [];

		const tx = db.transaction("clusters", "readonly");
		const store = tx.objectStore("clusters");
		const request = store.getAll();

		const selectedAlbumId = currentAlbum.value ? currentAlbum.value.id : null;
		console.log("Fetching clusters for album ID:", selectedAlbumId);


		return new Promise((resolve, reject) => {
			request.onsuccess = () => {

				const clustersArray = request.result

					.filter(cluster => {

						console.log(
							"Comparing...",
							"cluster.album_id =", cluster.album_id,
							"selectedAlbumId =", selectedAlbumId,
							"EQUAL?", cluster.album_id === selectedAlbumId
						);

						if (selectedAlbumId !== null) {
							return cluster.album_id === selectedAlbumId;
						}
						return cluster.album_id === null;
					})
					.map(cluster => {
						const websitesList = cluster.websites
							.map(id => websites.value[id])
							.filter(Boolean)
							.map(website => ({
								id: website.id,
								title: website.title,
								url: website.url,
								domain: website.domain,
								processed_at: website.processed_at
							}));

						return {
							cluster_id: cluster.id,
							topic: cluster.topic,
							website_count: websitesList.length,
							websites: websitesList,
							similar_links: cluster.similar_links || {}
						};
					});

				resolve(clustersArray);
			};

			request.onerror = () => reject(request.error);
		});


	} catch (error) {
		console.error("❌ Error fetching clusters:", error);
		return [];
	}
}

async function fetchSimilarities() {
	try {
		if (!db) return {};

		const similarities = {};

		// Get the active album filter
		const activeAlbumId = currentAlbum.value ? currentAlbum.value.id : null;

		// Only calculate similarities for clusters in the current album view
		const clusterIds = Object.keys(clusters.value).filter(id => {
			const cluster = clusters.value[id];
			return cluster.album_id === activeAlbumId;
		});

		for (const sourceClusterId of clusterIds) {
			const sourceCluster = clusters.value[sourceClusterId];
			if (!sourceCluster || !sourceCluster.websites.length) continue;

			const sourceWebsiteIds = sourceCluster.websites;
			const sourceEmbeddings = sourceWebsiteIds
				.map((id) => embeddings.value[id])
				.filter(Boolean);

			if (sourceEmbeddings.length === 0) continue;

			const sourceAvgEmbedding = averageEmbeddings(sourceEmbeddings);
			similarities[sourceClusterId] = {};

			for (const targetClusterId of clusterIds) {
				if (sourceClusterId === targetClusterId) continue;

				const targetCluster = clusters.value[targetClusterId];
				if (!targetCluster || !targetCluster.websites.length) continue;

				const targetWebsiteIds = targetCluster.websites;
				const targetEmbeddings = targetWebsiteIds
					.map((id) => embeddings.value[id])
					.filter(Boolean);

				if (targetEmbeddings.length === 0) continue;

				const targetAvgEmbedding = averageEmbeddings(targetEmbeddings);
				const similarity = cosineSimilarity(sourceAvgEmbedding, targetAvgEmbedding);

				if (similarity >= settings.similarityThreshold) {
					similarities[sourceClusterId][targetClusterId] = similarity;
				}
			}
		}

		return similarities;
	} catch (error) {
		console.error("❌ Error calculating similarities:", error);
		return {};
	}
}

function averageEmbeddings(embeddingsArray) {
	if (embeddingsArray.length === 0) return [];

	const dim = embeddingsArray[0].length;
	const avg = new Array(dim).fill(0);

	for (const embedding of embeddingsArray) {
		for (let i = 0; i < dim; i++) {
			avg[i] += embedding[i];
		}
	}

	for (let i = 0; i < dim; i++) {
		avg[i] /= embeddingsArray.length;
	}

	return avg;
}

async function fetchWebsiteDetails(websiteId) {
	try {
		console.log("Fetching website details for:", websiteId);

		if (!db) return null;

		const tx = db.transaction("websites", "readonly");

		const store = tx.objectStore("websites");

		return new Promise((resolve, reject) => {
			const request = store.get(websiteId);

			request.onsuccess = () => {
				const website = request.result;

				if (website) {
					resolve({
						website: {
							id: website.id,

							url: website.url,

							title: website.title,

							domain: website.domain,

							ai_summary: website.ai_summary,

							topic: website.topic,

							search_query: website.search_query,

							processed_at: website.processed_at,

							metadata: website.metadata,
						},
					});
				} else {
					resolve(null);
				}
			};

			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.error("❌ Error fetching website details:", error);

		return null;
	}
}

async function searchSimilarWebsites(query) {
	try {
		console.log("📡 Searching for similar websites:", query);

		// Generate embedding for the query

		const queryEmbedding = await generateEmbedding(query);

		if (!queryEmbedding) return [];

		// Find similar websites based on embeddings

		const results = [];

		for (const [websiteId, embedding] of Object.entries(embeddings.value)) {
			const similarity = cosineSimilarity(queryEmbedding, embedding);

			if (similarity >= 0.4) {
				// Lower threshold for search

				const website = websites.value[websiteId];

				if (website) {
					results.push({
						...website,

						similarity,

						snippet: website.ai_summary || "",

						description: website.ai_summary || "",
					});
				}
			}
		}

		// Sort by similarity and return top 10

		return results.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
	} catch (error) {
		console.error("❌ Error searching similar websites:", error);

		return [];
	}
}

function formatDate(dateString) {
	if (!dateString) return "N/A";
	const date = new Date(dateString);
	return date.toLocaleDateString();
}

function performSearch() {
	const term = searchInput.value.toLowerCase().trim();
	searchTerm = term;

	if (!term) {
		clearSearchHighlights();
		matchCount.value = 0;
		return;
	}

	const matchingNodes = graphData.nodes.filter(node => {
		if (node.type === 'cluster') {
			return (
				node.topic?.toLowerCase().includes(term) ||
				node.websites?.some(website =>
					website.title?.toLowerCase().includes(term) ||
					website.url?.toLowerCase().includes(term) ||
					website.domain?.toLowerCase().includes(term)
				)
			);
		}
		if (node.type === 'website') {
			return (
				node.title?.toLowerCase().includes(term) ||
				node.url?.toLowerCase().includes(term) ||
				node.domain?.toLowerCase().includes(term)
			);
		}
		return false;
	});

	matchCount.value = matchingNodes.length;
	highlightSearchResults(matchingNodes);

	// Auto-zoom to first match
	if (matchingNodes.length > 0 && svg && zoom && graphContainer.value) {
		const firstMatch = matchingNodes[0];
		const width = graphContainer.value.clientWidth;
		const height = graphContainer.value.clientHeight;

		svg.transition()
			.duration(1000 / settings.animationSpeed)
			.call(
				zoom.transform,
				d3.zoomIdentity
					.translate(width / 2, height / 2)
					.scale(1.2)
					.translate(-firstMatch.x, -firstMatch.y)
			);
	}
}

function highlightSearchResults(matchingNodes) {
	if (!container) return;

	const matchingIds = new Set(matchingNodes.map(d => d.id));

	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', d => matchingIds.has(d.id) ? 1 : 0.3)
		.attr('stroke-width', d => matchingIds.has(d.id) ? 4 : 2);

	container.select('.labels')
		.selectAll('.node-label')
		.style('opacity', d => matchingIds.has(d.id) ? 1 : 0.3)
		.style('font-weight', d => matchingIds.has(d.id) ? 'bold' : '500');
}

function clearSearchHighlights() {
	if (!container) return;

	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', 1)
		.attr('stroke-width', 2);

	container.select('.labels')
		.selectAll('.node-label')
		.style('opacity', 1)
		.style('font-weight', '500');
}

// function clearSearch() {
// 	searchInput.value = '';
// 	searchTerm = '';
// 	matchCount.value = 0;
// 	clearSearchHighlights();
// }

function openExternalLink(url) {
	window.open(url, "_blank", "noopener,noreferrer");
}

function processApiData(clustersData, similarities) {
	console.log("Processing API data:", { clustersData, similarities });

	const nodes = clustersData.map((cluster, index) => {
		const baseSize = Math.max(15, Math.min(40, cluster.website_count * 8 + 15));

		return {
			id: cluster.cluster_id,

			cluster_id: cluster.cluster_id,

			topic: cluster.topic,

			website_count: cluster.website_count,

			websites: cluster.websites || [],

			similar_links: cluster.similar_links || [],

			size: baseSize,

			baseSize: baseSize,

			type: "cluster",

			x: Math.cos((index * 2 * Math.PI) / clustersData.length) * 300,

			y: Math.sin((index * 2 * Math.PI) / clustersData.length) * 300,

			metadata: {
				description: `Cluster containing ${cluster.website_count} websites about ${cluster.topic}`,

				tags: ["cluster", cluster.topic.toLowerCase().replace(/\s+/g, "-")],
			},
		};
	});

	const links = [];

	Object.entries(similarities).forEach(([sourceId, targets]) => {
		Object.entries(targets).forEach(([targetId, similarity]) => {
			if (
				similarity >= settings.similarityThreshold &&
				!links.some(
					(l) =>
						(l.source === sourceId && l.target === targetId) ||
						(l.source === targetId && l.target === sourceId)
				)
			) {
				links.push({
					source: sourceId,

					target: targetId,

					similarity: similarity,

					strength: similarity,

					type: "cluster-link",
				});
			}
		});
	});

	console.log("✅ Processed data:", {
		nodeCount: nodes.length,

		linkCount: links.length,
	});

	return { nodes, links };
}

async function loadData() {
	isLoading.value = true;

	try {
		console.log("🔄 Loading data from IndexedDB...");

		// First load websites and embeddings
		await loadFromIndexedDB();

		// Then fetch processed clusters (already filtered by album in fetchClusters)
		const [clustersData, albumsData] = await Promise.all([
			fetchClusters(), // This is already filtered by currentAlbum
			fetchAlbums(),
		]);

		console.log("📊 Data loaded:", {
			clusterCount: clustersData.length,
			albumCount: Object.keys(albumsData).length,
			currentAlbum: currentAlbum.value?.name || 'All Clusters'
		});

		// UPDATE rawClusters with filtered data
		rawClusters = clustersData;

		// Calculate similarities ONLY for the filtered clusters
		const similarities = await fetchSimilarities();
		rawSimilarities = similarities;

		console.log("Similarities calculated:", Object.keys(similarities).length);

		// Process the filtered data into graph format
		graphData = processApiData(clustersData, similarities);

		if (graphData.nodes.length === 0) {
			console.warn("⚠️ No clusters found for this album, showing empty state");
			graphData = { nodes: [], links: [] };
		} else {
			console.log("✅ Graph data ready:", graphData);
		}
	} catch (error) {
		console.error("❌ Error loading data:", error);
		graphData = { nodes: [], links: [] };
	} finally {
		isLoading.value = false;
	}
}
function generatePlaceholderData() {
	console.log("🔄 Generating placeholder data...");
	const categories = [
		"Ideas",
		"Concepts",
		"Projects",
		"Notes",
		"Research",
		"Tasks",
	];
	const nodes = [];
	const nodeCount = 6;

	const nodeNames = [
		"Machine Learning",
		"Artificial Intelligence",
		"Data Science",
		"Web Development",
		"Cloud Computing",
		"Cybersecurity",
	];

	for (let i = 0; i < nodeCount; i++) {
		const category = categories[Math.floor(Math.random() * categories.length)];
		const baseSize = Math.random() * 15 + 15;
		nodes.push({
			id: `placeholder-${i}`,
			cluster_id: `placeholder-${i}`,
			topic: nodeNames[i] || `Cluster ${i + 1}`,
			website_count: Math.floor(Math.random() * 5) + 1,
			websites: [],
			similar_links: [],
			size: baseSize,
			baseSize: baseSize,
			type: "cluster",
			x: Math.cos((i * 2 * Math.PI) / nodeCount) * 200,
			y: Math.sin((i * 2 * Math.PI) / nodeCount) * 200,
			metadata: {
				description: `Placeholder cluster for ${nodeNames[i] || "various topics"
					}`,
				tags: [category.toLowerCase(), "placeholder"],
			},
		});
	}

	const links = [];
	for (let i = 0; i < nodeCount - 1; i++) {
		if (Math.random() < 0.6) {
			links.push({
				source: nodes[i].id,
				target: nodes[i + 1].id,
				similarity: 0.5 + Math.random() * 0.3,
				strength: 0.5,
				type: "cluster-link",
			});
		}
	}

	return { nodes, links };
}

async function refreshData() {
	console.log("🔄 Refreshing data...");
	selectedWebsite.value = null;
	explodedNode.value = null;
	await loadData();
	if (simulation) {
		simulation.nodes(graphData.nodes);
		simulation.force("link").links(graphData.links);
		simulation.alpha(1).restart();
		renderGraph();
	}
}

function updateConnections() {
	if (rawClusters.length > 0) {
		filterGraphByAlbum();
	}
}

function explodeNode(clusterNode) {
	if (explodedNode.value) {
		collapseNode();
	}

	explodedNode.value = clusterNode;
	const centerX = clusterNode.x;
	const centerY = clusterNode.y;

	clusterNode.fx = centerX;
	clusterNode.fy = centerY;

	const radius = 50;

	websiteNodes = [];
	const totalNodes = clusterNode.websites.length + 1;
	const angleStep = (2 * Math.PI) / totalNodes;

	clusterNode.websites.forEach((website, index) => {
		const angle = angleStep * index;
		const websiteNode = {
			id: `website-${website.id}`,
			websiteId: website.id,
			title: website.title,
			url: website.url,
			domain: website.domain,
			processed_at: website.processed_at,
			size: 10,
			baseSize: 10,
			type: "website",
			parentCluster: clusterNode.id,
			x: centerX,
			y: centerY,
			targetX: centerX + Math.cos(angle) * radius,
			targetY: centerY + Math.sin(angle) * radius,
			animationDelay: 0,
		};
		websiteNodes.push(websiteNode);
		graphData.nodes.push(websiteNode);

		graphData.links.push({
			source: clusterNode.id,
			target: websiteNode.id,
			type: "website-link",
		});
	});

	const discoverAngle = angleStep * clusterNode.websites.length;
	const discoverNode = {
		id: `discover-${clusterNode.id}`,
		title: "Discover Similar",
		size: 14,
		baseSize: 14,
		type: "discover",
		parentCluster: clusterNode.id,
		x: centerX,
		y: centerY,
		targetX: centerX + Math.cos(discoverAngle) * radius,
		targetY: centerY + Math.sin(discoverAngle) * radius,
		animationDelay: 0,
	};
	websiteNodes.push(discoverNode);
	graphData.nodes.push(discoverNode);

	graphData.links.push({
		source: clusterNode.id,
		target: discoverNode.id,
		type: "discover-link",
	});

	simulation.nodes(graphData.nodes);
	simulation.force("link").links(graphData.links);

	renderGraph();

	websiteNodes.forEach((node) => {
		const d3Node = graphData.nodes.find((n) => n.id === node.id);
		if (d3Node) {
			d3Node.fx = node.targetX;
			d3Node.fy = node.targetY;
		}
	});

	simulation.alpha(0.1).restart();

	setTimeout(() => {
		websiteNodes.forEach((node) => {
			const d3Node = graphData.nodes.find((n) => n.id === node.id);
			if (d3Node) {
				d3Node.fx = null;
				d3Node.fy = null;
			}
		});

		clusterNode.fx = null;
		clusterNode.fy = null;
	}, 300);
}

function collapseNode() {
	if (!explodedNode.value) return;

	const centerX = explodedNode.value.x;
	const centerY = explodedNode.value.y;

	explodedNode.value.fx = centerX;
	explodedNode.value.fy = centerY;

	websiteNodes.forEach((node) => {
		const d3Node = graphData.nodes.find((n) => n.id === node.id);
		if (d3Node) {
			d3Node.fx = centerX;
			d3Node.fy = centerY;
		}
	});

	simulation.alpha(0.1).restart();

	setTimeout(() => {
		graphData.nodes = graphData.nodes.filter(
			(node) => node.type !== "website" && node.type !== "discover"
		);

		graphData.links = graphData.links.filter(
			(link) => link.type !== "website-link" && link.type !== "discover-link"
		);

		websiteNodes = [];

		if (explodedNode.value) {
			explodedNode.value.fx = null;
			explodedNode.value.fy = null;
		}

		explodedNode.value = null;
		selectedWebsite.value = null;

		simulation.nodes(graphData.nodes);
		simulation.force("link").links(graphData.links);
		simulation.alpha(0.5).restart();

		renderGraph();
	}, 300);
}

async function handleDiscoverClick() {
	if (!explodedNode.value) return;

	showDiscoverModal.value = true;
	isLoadingSimilar.value = true;
	similarWebsites.value = [];

	try {
		const results = await searchSimilarWebsites(explodedNode.value.topic);
		similarWebsites.value = results;
	} catch (error) {
		console.error("Error loading similar websites:", error);
	} finally {
		isLoadingSimilar.value = false;
	}
}

function startDraggingSticky(e) {
	isDraggingSticky = true;
	const stickyEl = e.currentTarget.parentElement;
	const rect = stickyEl.getBoundingClientRect();
	dragOffsetX = e.clientX - rect.left;
	dragOffsetY = e.clientY - rect.top;
	document.addEventListener("mousemove", handleStickyDrag);
	document.addEventListener("mouseup", stopStickyDrag);
}

function handleStickyDrag(e) {
	if (!isDraggingSticky) return;
	stickyNoteStyle.value = {
		left: e.clientX - dragOffsetX + "px",
		top: e.clientY - dragOffsetY + "px",
	};
}

function stopStickyDrag() {
	isDraggingSticky = false;
	document.removeEventListener("mousemove", handleStickyDrag);
	document.removeEventListener("mouseup", stopStickyDrag);
}

async function initializeGraph() {
	const width = graphContainer.value.clientWidth;
	const height = graphContainer.value.clientHeight;

	await loadData();

	svg = d3
		.select(graphContainer.value)
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	container = svg.append("g");

	zoom = d3
		.zoom()
		.scaleExtent([0.2, 3])
		.on("zoom", (event) => {
			container.attr("transform", event.transform);
		});

	svg.call(zoom);

	simulation = d3
		.forceSimulation(graphData.nodes)
		.force(
			"link",
			d3
				.forceLink(graphData.links)
				.id((d) => d.id)
				.distance((d) => (d.type === "website-link" ? 80 : 200))
				.strength(0.03)
		)
		.force("charge", d3.forceManyBody().strength(-200))
		.force("center", d3.forceCenter(0, 0))
		.force(
			"collision",
			d3.forceCollide().radius((d) => d.size * settings.nodeSize + 15)
		)
		.force("x", d3.forceX().strength(0.02))
		.force("y", d3.forceY().strength(0.02));

	renderGraph();

	setTimeout(() => {
		const bounds = container.node().getBBox();
		if (bounds.width > 0 && bounds.height > 0) {
			const fullWidth = bounds.width;
			const fullHeight = bounds.height;
			const midX = bounds.x + fullWidth / 2;
			const midY = bounds.y + fullHeight / 2;

			const scale = Math.min(width / fullWidth, height / fullHeight) * 0.8;
			const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

			svg
				.transition()
				.duration(2000)
				.call(
					zoom.transform,
					d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
				);
		}
	}, 500);
}

function renderGraph() {
	container.selectAll(".links").data([null]).join("g").attr("class", "links");
	container.selectAll(".nodes").data([null]).join("g").attr("class", "nodes");
	container.selectAll(".labels").data([null]).join("g").attr("class", "labels");

	const linkGroup = container.select(".links");
	const nodeGroup = container.select(".nodes");
	const labelGroup = container.select(".labels");

	const links = linkGroup
		.selectAll(".link")
		.data(
			graphData.links,
			(d) => `${d.source.id || d.source}-${d.target.id || d.target}`
		)
		.join("line")
		.attr("class", (d) => `link ${d.type}`)
		.style("opacity", (d) => {
			if (d.type === "website-link" || d.type === "discover-link") return 0.6;
			return showConnections.value ? 0.4 : 0;
		})
		.style("stroke-width", (d) => {
			if (d.type === "website-link" || d.type === "discover-link") return 1.5;
			return Math.max(1, (d.similarity || 0.5) * 4);
		})
		.style("stroke", (d) => {
			if (d.type === "discover-link") return "#95a5a6";
			if (d.type === "website-link") return "#adb5bd";
			return "#adb5bd";
		});

	const nodes = nodeGroup
		.selectAll(".node")
		.data(graphData.nodes, (d) => d.id)
		.join("circle")
		.attr("class", (d) => `node ${d.type}`)
		.attr("data-id", (d) => d.id)
		.attr("r", (d) => d.size * settings.nodeSize)
		.attr("fill", (d) => {
			if (d.type === "discover") {
				return "#4A90E2";
			}
			if (d.type === "website") {
				return isDarkMode.value ? "#374151" : "#f4f4f4";
			}
			return isDarkMode.value ? "#374151" : "#f4f4f4";
		})
		.attr("stroke", (d) => {
			if (d.type === "discover") {
				return "#357ABD";
			}
			if (d.type === "website") {
				return isDarkMode.value ? "#4b5563" : "#d1d5db";
			}
			return isDarkMode.value ? "#4b5563" : "#d1d5db";
		})
		.attr("stroke-width", 2)
		.call(drag(simulation));

	const labels = labelGroup
		.selectAll(".node-label")
		.data(graphData.nodes, (d) => d.id)
		.join("text")
		.attr("class", "node-label")
		.text((d) => {
			if (d.type === "website")
				return d.title.substring(0, 20) + (d.title.length > 20 ? "..." : "");
			if (d.type === "discover") return "";
			return d.topic;
		})
		.style("font-size", (d) => {
			if (d.type === "website") return "8px";
			if (d.type === "discover") return "18px";
			return Math.max(10, (d.size * settings.nodeSize) / 3.5) + "px";
		})
		.style("fill", (d) => {
			if (d.type === "discover") return "#ffffff";
			return isDarkMode.value ? "#ffffff" : "#000000";
		})
		.style("font-weight", (d) => (d.type === "discover" ? "400" : "500"))
		.style('text-anchor', 'middle');

	nodes
		.on("mouseover", handleNodeMouseOver)
		.on("mouseout", handleNodeMouseOut)
		.on("click", handleNodeClick)
		.on('contextmenu', handleNodeRightClick);

	simulation.on("tick", () => {
		links
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

		labels
			.attr("x", (d) => d.x)
			.attr("y", (d) => {
				if (d.type === "website" || d.type === "discover") return d.y + 4;
				return d.y + d.size * settings.nodeSize + 18;
			});
	});
}

function drag(simulation) {
	function dragstarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	return d3
		.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
}

// ==============================================
// EVENT HANDLERS
// ==============================================
function handleNodeMouseOver(event, d) {
	const tooltipEl = d3.select(tooltip.value);
	tooltipEl
		.transition()
		.duration(200 / settings.animationSpeed)
		.style("opacity", 1);

	let tooltipContent = "";
	if (d.type === "cluster") {
		tooltipContent = `<strong>${d.topic}</strong><br>Websites: ${d.website_count}<br>Click to explode`;
	} else if (d.type === "website") {
		tooltipContent = `<strong>${d.title}</strong><br>${d.domain}<br>Click for details`;
	} else if (d.type === "discover") {
		tooltipContent = `<strong>Discover Similar</strong><br>Find related websites`;
	}

	tooltipEl
		.html(tooltipContent)
		.style("left", event.pageX + 15 + "px")
		.style("top", event.pageY - 10 + "px");

	if (d.type === "cluster") {
		highlightConnections(d);
	}
}

function handleNodeMouseOut() {
	d3.select(tooltip.value)
		.transition()
		.duration(200 / settings.animationSpeed)
		.style("opacity", 0);
	clearHighlights();
}

async function handleNodeClick(event, d) {
	event.stopPropagation();

	if (d.type === "cluster") {
		explodeNode(d);
	} else if (d.type === "website") {
		await showWebsiteDetails(event, d);
	} else if (d.type === "discover") {
		await handleDiscoverClick();
	}
}

async function showWebsiteDetails(event, websiteNode) {
	selectedWebsite.value = websiteNode;
	websiteDetails.value = null;

	const containerRect = graphContainer.value.getBoundingClientRect();
	const nodeScreenX = event.pageX - containerRect.left;
	const nodeScreenY = event.pageY - containerRect.top;

	const stickyWidth = 300;
	const stickyHeight = 280;

	let left = nodeScreenX + 20;
	let top = nodeScreenY - stickyHeight / 2;

	if (left + stickyWidth > containerRect.width) {
		left = nodeScreenX - stickyWidth - 20;
	}
	if (top < 20) top = 20;
	if (top + stickyHeight > containerRect.height - 20) {
		top = containerRect.height - stickyHeight - 20;
	}

	stickyNoteStyle.value = {
		left: left + "px",
		top: top + "px",
	};

	try {
		const result = await fetchWebsiteDetails(websiteNode.websiteId);

		if (result && result.website) {
			websiteDetails.value = result.website;
		}
	} catch (error) {
		console.error("Error loading website details:", error);
	}
}

function handleBackgroundClick() {
	selectedWebsite.value = null;
	showAlbumsDropdown.value = false;
	closeContextMenu();
}

function closeStickyNote() {
	selectedWebsite.value = null;
	websiteDetails.value = null;
}

function closeDiscoverModal() {
	showDiscoverModal.value = false;
	similarWebsites.value = [];
}

function handleNodeRightClick(event, d) {
	event.preventDefault();
	event.stopPropagation();

	if (d.type !== 'cluster') return;

	contextCluster.value = clusters.value[d.id];
	contextMenuStyle.value = {
		left: event.pageX + 'px',
		top: event.pageY + 'px'
	};
	showContextMenu.value = true;
}

function closeContextMenu() {
	showContextMenu.value = false;
	contextCluster.value = null;
}

// Rename Functions
function renameCluster() {
	renameInput.value = contextCluster.value.topic;
	showRenameModal.value = true;
	showContextMenu.value = false;
}

function closeRenameModal() {
	showRenameModal.value = false;
	renameInput.value = '';
}

async function confirmRename() {
	if (!renameInput.value.trim() || !contextCluster.value) return;

	try {
		const clusterId = contextCluster.value.id;
		clusters.value[clusterId].topic = renameInput.value.trim();

		await saveToIndexedDB();
		await refreshData();

		closeRenameModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error renaming cluster:', error);
		alert('Failed to rename cluster');
	}
}

// Add Websites Functions
function showAddWebsitesModal() {
	selectedWebsitesToAdd.value = [];
	showAddWebsites.value = true;
	showContextMenu.value = false;
}

function closeAddWebsitesModal() {
	showAddWebsites.value = false;
	selectedWebsitesToAdd.value = [];
}

function toggleWebsiteSelection(websiteId) {
	const index = selectedWebsitesToAdd.value.indexOf(websiteId);
	if (index > -1) {
		selectedWebsitesToAdd.value.splice(index, 1);
	} else {
		selectedWebsitesToAdd.value.push(websiteId);
	}
}

async function confirmAddWebsites() {
	if (!contextCluster.value || selectedWebsitesToAdd.value.length === 0) return;

	try {
		const clusterId = contextCluster.value.id;

		for (const websiteId of selectedWebsitesToAdd.value) {
			if (!clusters.value[clusterId].websites.includes(websiteId)) {
				clusters.value[clusterId].websites.push(websiteId);
				websites.value[websiteId].cluster_id = clusterId;
			}
		}

		await saveToIndexedDB();
		await refreshData();

		closeAddWebsitesModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error adding websites:', error);
		alert('Failed to add websites');
	}
}

// Remove Websites Functions
function showRemoveWebsitesModal() {
	selectedWebsitesToRemove.value = [];
	showRemoveWebsites.value = true;
	showContextMenu.value = false;
}

function closeRemoveWebsitesModal() {
	showRemoveWebsites.value = false;
	selectedWebsitesToRemove.value = [];
}

function toggleRemoveSelection(websiteId) {
	const index = selectedWebsitesToRemove.value.indexOf(websiteId);
	if (index > -1) {
		selectedWebsitesToRemove.value.splice(index, 1);
	} else {
		selectedWebsitesToRemove.value.push(websiteId);
	}
}

async function confirmRemoveWebsites() {
	if (!contextCluster.value || selectedWebsitesToRemove.value.length === 0) return;

	try {
		const clusterId = contextCluster.value.id;

		for (const websiteId of selectedWebsitesToRemove.value) {
			const index = clusters.value[clusterId].websites.indexOf(websiteId);
			if (index > -1) {
				clusters.value[clusterId].websites.splice(index, 1);
				delete websites.value[websiteId].cluster_id;
			}
		}

		// Delete cluster if empty
		if (clusters.value[clusterId].websites.length === 0) {
			delete clusters.value[clusterId];
		}

		await saveToIndexedDB();
		await refreshData();

		closeRemoveWebsitesModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error removing websites:', error);
		alert('Failed to remove websites');
	}
}

// Delete Cluster
async function deleteCluster() {
	if (!contextCluster.value) return;

	const confirmed = confirm(`Delete cluster "${contextCluster.value.topic}"? This will not delete the websites.`);
	if (!confirmed) return;

	try {
		const clusterId = contextCluster.value.id;

		// Remove cluster reference from websites
		for (const websiteId of clusters.value[clusterId].websites) {
			if (websites.value[websiteId]) {
				delete websites.value[websiteId].cluster_id;
			}
		}

		delete clusters.value[clusterId];

		await saveToIndexedDB();
		await refreshData();

		showContextMenu.value = false;
		contextCluster.value = null;
	} catch (error) {
		console.error('Error deleting cluster:', error);
		alert('Failed to delete cluster');
	}
}

function handleProfileClick() {
	alert("Profile functionality would be implemented here");
}


function highlightConnections(node) {
	const connectedNodeIds = new Set();
	const connectedLinks = new Set();

	graphData.links.forEach((link) => {
		const sourceId = link.source.id || link.source;
		const targetId = link.target.id || link.target;

		if (sourceId === node.id && link.type === "cluster-link") {
			connectedNodeIds.add(targetId);
			connectedLinks.add(link);
		} else if (targetId === node.id && link.type === "cluster-link") {
			connectedNodeIds.add(sourceId);
			connectedLinks.add(link);
		}
	});

	// Highlight connected nodes
	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? 1 : 0.4
		)
		.attr('stroke', d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? '#4A90E2' : null
		)
		.attr('stroke-width', d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? 3 : 2
		);

	// Highlight connected links
	container.select('.links')
		.selectAll('.link')
		.style('opacity', d => connectedLinks.has(d) ? 0.8 : 0.2)
		.style('stroke', d => connectedLinks.has(d) ? '#4A90E2' : null)
		.style('stroke-width', d => connectedLinks.has(d) ? 3 : null);
}

function clearHighlights() {
	if (!container) return;

	// Don't clear search highlights if there's an active search
	if (!searchTerm) {
		container.select('.nodes')
			.selectAll('.node')
			.style('opacity', 1)
			.attr('stroke-width', 2);

		container.select('.labels')
			.selectAll('.node-label')
			.style('opacity', 1)
			.style('font-weight', '500');
	} else {
		// Restore search highlight state
		const term = searchTerm.toLowerCase();
		container.select('.nodes')
			.selectAll('.node')
			.style('opacity', d => {
				const matches = d.type === 'cluster'
					? d.topic?.toLowerCase().includes(term)
					: d.title?.toLowerCase().includes(term);
				return matches ? 1 : 0.3;
			});
	}

	// Always clear connection highlights
	container.select('.nodes')
		.selectAll('.node')
		.attr('stroke', d => {
			if (d.type === 'discover') return '#357ABD';
			if (d.type === 'website') return isDarkMode.value ? '#4b5563' : '#d1d5db';
			return isDarkMode.value ? '#4b5563' : '#d1d5db';
		})
		.attr('stroke-width', 2);

	container.select('.links')
		.selectAll('.link')
		.style('opacity', d => {
			if (d.type === 'website-link' || d.type === 'discover-link') return 0.6;
			return showConnections.value ? 0.4 : 0;
		})
		.style('stroke', d => {
			if (d.type === 'discover-link') return '#95a5a6';
			if (d.type === 'website-link') return '#adb5bd';
			return '#adb5bd';
		})
		.style('stroke-width', d => {
			if (d.type === 'website-link' || d.type === 'discover-link') return 1.5;
			return Math.max(1, (d.similarity || 0.5) * 4);
		});
}

// ==============================================
// SETTINGS FUNCTIONS
// ==============================================
function toggleSettings() {
	showSettings.value = !showSettings.value;
}

function closeSettings() {
	showSettings.value = false;
}

function toggleDarkMode() {
	isDarkMode.value = !isDarkMode.value;
	updateTheme();
}

function updateTheme() {
	if (!container) return;

	container
		.select(".nodes")
		.selectAll(".node")
		.transition()
		.duration(300)
		.attr("fill", (d) => {
			if (d.type === "discover") return "#4A90E2";
			if (d.type === "website") return isDarkMode.value ? "#374151" : "#f4f4f4";
			return isDarkMode.value ? "#374151" : "#f4f4f4";
		})
		.attr("stroke", (d) => {
			if (d.type === "discover") return "#357ABD";
			if (d.type === "website") return isDarkMode.value ? "#4b5563" : "#d1d5db";
			return isDarkMode.value ? "#4b5563" : "#d1d5db";
		});

	container
		.select(".labels")
		.selectAll(".node-label")
		.transition()
		.duration(300)
		.style("fill", (d) => {
			if (d.type === "discover") return "#ffffff";
			return isDarkMode.value ? "#ffffff" : "#000000";
		});
}

function updateNodeSizes() {
	container
		.select(".nodes")
		.selectAll(".node")
		.transition()
		.duration(300 / settings.animationSpeed)
		.attr("r", (d) => d.baseSize * settings.nodeSize);

	container
		.select(".labels")
		.selectAll(".node-label")
		.transition()
		.duration(300 / settings.animationSpeed)
		.style("font-size", (d) => {
			if (d.type === "website") return "8px";
			if (d.type === "discover") return "18px";
			return Math.max(10, (d.baseSize * settings.nodeSize) / 3.5) + "px";
		});

	if (simulation) {
		simulation.force(
			"collision",
			d3.forceCollide().radius((d) => d.baseSize * settings.nodeSize + 15)
		);
		simulation.alpha(0.3).restart();
	}
}

function resetSettings() {
	settings.nodeSize = 1.0;
	settings.animationSpeed = 1.0;
	settings.similarityThreshold = 0.5;
	isDarkMode.value = false;
	updateNodeSizes();
	updateTheme();
	updateConnections();
}

function resetView() {
	const width = graphContainer.value.clientWidth;
	const height = graphContainer.value.clientHeight;
	const bounds = container.node().getBBox();

	if (bounds.width > 0 && bounds.height > 0) {
		const fullWidth = bounds.width;
		const fullHeight = bounds.height;
		const midX = bounds.x + fullWidth / 2;
		const midY = bounds.y + fullHeight / 2;
		const scale = Math.min(width / fullWidth, height / fullHeight) * 0.8;
		const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

		svg
			.transition()
			.duration(1000 / settings.animationSpeed)
			.call(
				zoom.transform,
				d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
			);
	}
}

function toggleConnections() {
	container
		.select(".links")
		.selectAll(".link.cluster-link")
		.transition()
		.duration(500 / settings.animationSpeed)
		.style("opacity", showConnections.value ? 0.4 : 0);
}

function detectPlatform() {
	const userAgent = navigator.userAgent.toLowerCase();
	if (userAgent.includes("linux")) return "Linux";
	if (userAgent.includes("mac")) return "macOS";
	if (userAgent.includes("win")) return "Windows";
	return "Unknown";
}

function initDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("FunkyAIDB", 2);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const database = event.target.result;

			if (!database.objectStoreNames.contains("websites")) {
				database.createObjectStore("websites", { keyPath: "id" });
			}
			if (!database.objectStoreNames.contains("clusters")) {
				database.createObjectStore("clusters", { keyPath: "id" });
			}
			if (!database.objectStoreNames.contains("embeddings")) {
				database.createObjectStore("embeddings", { keyPath: "id" });
			}
			if (!database.objectStoreNames.contains("albums")) {
				database.createObjectStore("albums", { keyPath: "id" });
			}
			if (!database.objectStoreNames.contains("queue")) {
				database.createObjectStore("queue", { keyPath: "id" });
			}
		};
	});
}

function normalizeTopicTerm(term) {
	if (!term) return "";

	let normalized = term.toLowerCase().trim();

	if (normalized.endsWith("ies")) {
		normalized = normalized.slice(0, -3) + "y";
	} else if (normalized.endsWith("es")) {
		normalized = normalized.slice(0, -2);
	} else if (normalized.endsWith("s")) {
		normalized = normalized.slice(0, -1);
	}

	normalized = normalized.replace(/(ing|ed|er)$/, "");

	return normalized;
}

// Check if topics match (from backend)
function topicsMatch(topic1, topic2) {
	if (!topic1 || !topic2) return false;

	const normalize = (s) => {
		s = s.toLowerCase().trim();
		s = s.replace(/[^a-z0-9 ]/g, "");
		if (s.endsWith("s")) s = s.slice(0, -1);
		return s;
	};

	const n1 = normalize(topic1);
	const n2 = normalize(topic2);

	if (n1 === n2) return true;

	const set1 = new Set(n1.split(" "));
	const set2 = new Set(n2.split(" "));
	const intersection = [...set1].filter((x) => set2.has(x));

	if (intersection.length > 0) return true;

	const synonyms = {
		gpu: ["graphics card", "video card"],
		cpu: ["processor", "chip"],
		ai: ["artificial intelligence", "machine learning", "ml"],
		phone: ["mobile", "smartphone"],
		laptop: ["notebook", "portable computer"],
	};

	for (const [key, values] of Object.entries(synonyms)) {
		if (n1 === key && values.includes(n2)) return true;
		if (n2 === key && values.includes(n1)) return true;
	}

	return false;
}

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}

// Generate embedding (Transformers.js)
async function generateEmbedding(text) {
	if (!embeddingModel) return null;

	try {
		const result = await embeddingModel(text, {
			pooling: "mean",
			normalize: true,
		});
		// result.data is a TypedArray/ArrayBuffer-like; convert to regular array
		return Array.from(result.data);
	} catch (err) {
		console.error("Error generating embedding:", err);
		return null;
	}
}

async function generateSummaryAndTopic(metadata, content) {
	// If summarizationModel isn't ready, return fallback
	if (!summarizationModel) return { summary: "", topic: "", query: "" };

	try {
		const contentChunk = content.substring(0, 2500);

		// STEP 1: Generate summary first (needed for topic and query)
		const summaryResult = await summarizationModel.chat.completions.create({
			messages: [{
				role: "user",
				content: `Create a detailed 2-3 sentence summary from this webpage content:

TITLE: ${metadata.title}
DESCRIPTION: ${metadata.description || ""}
CONTENT: ${contentChunk}

Write a summary that describes what this page is about, what it offers, and key details. Make it good for semantic search:

Summary:`
			}],
			max_tokens: 120,
			temperature: 0.3,
		});

		const summary = summaryResult.choices?.[0]?.message?.content?.trim() ?? "";
		console.log("Summary generated:", summary);

		// STEP 2 & 3: Generate topic and query in parallel (now that summary exists)
		const [topicResult, queryResult] = await Promise.all([
			summarizationModel.chat.completions.create({
				messages: [{
					role: "user",
					content: `What is the main topic of this page in ONLY 1-2 words?

TITLE: ${metadata.title}
SUMMARY: ${summary}

Main topic:`
				}],
				max_tokens: 10,
				temperature: 0.2,
			}),

			summarizationModel.chat.completions.create({
				messages: [{
					role: "user",
					content: `Create a Google search query to find this page:

TITLE: ${metadata.title}
DOMAIN: ${metadata.domain}
SUMMARY: ${summary}

Search query:`
				}],
				max_tokens: 20,
				temperature: 0.2,
			})
		]);

		console.log("Topic and query processing complete");

		// Extract results
		const topic = topicResult.choices?.[0]?.message?.content?.trim() ?? "";
		const query = queryResult.choices?.[0]?.message?.content?.trim() ?? "";

		console.log("Final results:", { summary, topic, query });

		// Validate and return with fallbacks
		return {
			summary: summary || metadata.description || contentChunk.substring(0, 200),
			topic: topic || extractTopic(metadata.title, metadata.keywords) || "General",
			query: query || `${metadata.title} ${metadata.domain}`.trim()
		};

	} catch (err) {
		console.error("Error in chained summarization:", err);

		// Fallback to extractive summary
		return {
			summary: extractFallbackSummary(content, metadata),
			topic: extractTopic(metadata.title, metadata.keywords) || "General",
			query: `${metadata.title || ""} ${metadata.domain || ""}`.trim()
		};
	}
}

// Helper: Extract topic from title
function extractTopic(title, keywords) {
	if (!title) return null;
	const stopWords = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or']);
	return title
		.toLowerCase()
		.split(/\W+/)
		.filter(w => !stopWords.has(w) && w.length > 2)
		.slice(0, 2)
		.join(' ');
}

// Helper: Extractive fallback summary
function extractFallbackSummary(content, metadata) {
	if (metadata.description) return metadata.description;

	// Extract first 2-3 meaningful sentences
	const sentences = content
		.substring(0, 1000)
		.split(/[.!?]+/)
		.map(s => s.trim())
		.filter(s => s.length > 30 && s.length < 200);

	return sentences.slice(0, 2).join('. ') + '.';
}

function findSimilarWebsites(targetEmbedding, excludeId = null, albumId = null) {
	const similarities = [];

	for (const [websiteId, embedding] of Object.entries(embeddings.value)) {
		if (excludeId && websiteId === excludeId) continue;

		const website = websites.value[websiteId];
		if (!website || website.album_id !== albumId) continue;

		const similarity = cosineSimilarity(targetEmbedding, embedding);
		similarities.push({ websiteId, similarity });
	}

	return similarities.sort((a, b) => b.similarity - a.similarity);
}

// Assign to cluster
function assignToCluster(websiteId, topic, embedding, searchQuery, albumId = null) {
	const normalizedTopic = normalizeTopicTerm(topic);

	// Find similar websites
	const similarWebsites = findSimilarWebsites(embedding, websiteId, albumId);

	// Try to assign to existing cluster IN THIS ALBUM
	for (const { websiteId: similarId, similarity } of similarWebsites) {
		for (const [clusterId, cluster] of Object.entries(clusters.value)) {
			if (cluster.album_id !== albumId) continue;

			if (cluster.websites.includes(similarId)) {
				const clusterTopic = cluster.topic;

				// High similarity
				if (similarity >= SIMILARITY_THRESHOLD) {
					if (!cluster.websites.includes(websiteId)) {
						cluster.websites.push(websiteId);
					}
					console.log(`🔗 Added to cluster ${clusterId} in album ${albumId || 'All Clusters'}`);

					return clusterId;
				}

				// Loose similarity + topic match
				if (
					similarity >= LOOSE_SIMILARITY_THRESHOLD &&
					topicsMatch(topic, clusterTopic)
				) {
					if (!cluster.websites.includes(websiteId)) {
						cluster.websites.push(websiteId);
					}
					console.log(`🔗 Added to cluster ${clusterId} (loose + topic)`);
					return clusterId;
				}
			}
		}
	}

	// Create new cluster
	const newClusterId = generateId();
	clusters.value[newClusterId] = {
		id: newClusterId,
		topic: topic,
		websites: [websiteId],
		similar_links: {},
		album_id: albumId,
	};

	console.log(`🆕 Created new cluster: ${newClusterId} in album ${albumId || 'All Clusters'}`);
	return newClusterId;
}



// Process website
async function processWebsite(data) {
	if (!embeddingModel || !summarizationModel) {
		console.error("Models not loaded");
		return;
	}

	try {
		const websiteId = generateId();
		const metadata = data.metadata || {};
		const content = data.content || "";

		console.log(`📝 Processing: ${metadata.title || data.url}`);

		// Generate summary and topic (Web-LLM)
		const { summary, topic, query } = await generateSummaryAndTopic(
			metadata,
			content
		);

		// Generate embedding from summary (Transformers.js)
		const embeddingText =
			summary || `${metadata.title} ${metadata.description || ""}`.trim();
		const embedding = await generateEmbedding(embeddingText);

		if (!embedding) {
			console.error("Failed to generate embedding");
			return;
		}

		// Store website data
		websites.value[websiteId] = {
			id: websiteId,
			url: data.url,
			title: metadata.title || data.url,
			domain: metadata.domain || new URL(data.url).hostname,
			topic: topic,
			ai_summary: summary,
			search_query: query,
			metadata: metadata,
			album_id: data.album || null,
			processed_at: new Date().toISOString(),
		};

		// Store embedding separately
		embeddings.value[websiteId] = embedding;

		// Assign to cluster
		const clusterId = assignToCluster(websiteId, topic, embedding, query, data.album);
		websites.value[websiteId].cluster_id = clusterId;

		// Save to IndexedDB
		await saveToIndexedDB();

		showNewDataNotification.value = true;

		setTimeout(() => {
			showNewDataNotification.value = false;
		}, 4000);

		await refreshData();

		console.log(`✅ Processed: ${websiteId}`);
	} catch (err) {
		console.error("Error processing website:", err);
	}
}

async function processQueue() {
	if (isProcessing.value || processingQueue.value.length === 0) return;

	isProcessing.value = true;
	processedCount.value = 0;

	for (const item of processingQueue.value) {
		await processWebsite(item);
		processedCount.value++;
	}

	processingQueue.value = [];
	processedCount.value = 0;
	isProcessing.value = false;
}

// Delete website
async function deleteWebsite(websiteId) {
	// Remove from clusters
	for (const cluster of Object.values(clusters.value)) {
		const index = cluster.websites.indexOf(websiteId);
		if (index > -1) {
			cluster.websites.splice(index, 1);

			// Delete empty clusters
			if (cluster.websites.length === 0) {
				delete clusters.value[cluster.id];
			}
		}
	}

	// Remove website and embedding
	delete websites.value[websiteId];
	delete embeddings.value[websiteId];

	await saveToIndexedDB();
	console.log(`🗑️ Deleted website: ${websiteId}`);
}

async function saveToIndexedDB() {
	if (!db) return;

	try {
		const tx = db.transaction(
			["websites", "clusters", "embeddings"],
			"readwrite"
		);

		const websiteStore = tx.objectStore("websites");
		await new Promise((resolve, reject) => {
			const r = websiteStore.clear();
			r.onsuccess = resolve;
			r.onerror = () => reject(r.error);
		});

		for (const website of Object.values(websites.value)) {
			try {
				// Convert to plain object by JSON serialization or manual copy
				const plainWebsite = JSON.parse(JSON.stringify(website));

				await new Promise((resolve, reject) => {
					const r = websiteStore.put(plainWebsite);
					r.onsuccess = resolve;
					r.onerror = () => reject(r.error);
				});
			} catch (err) {
				console.error("❌ WEBSITE FAILED:", website, err);
			}
		}

		const clusterStore = tx.objectStore("clusters");
		await new Promise((resolve, reject) => {
			const r = clusterStore.clear();
			r.onsuccess = resolve;
			r.onerror = () => reject(r.error);
		});

		for (const cluster of Object.values(clusters.value)) {
			try {
				// Convert to plain object
				const plainCluster = JSON.parse(JSON.stringify(cluster));

				await new Promise((resolve, reject) => {
					const r = clusterStore.put(plainCluster);
					r.onsuccess = resolve;
					r.onerror = () => reject(r.error);
				});
			} catch (err) {
				console.error("❌ CLUSTER FAILED:", cluster, err);
			}
		}

		const embeddingStore = tx.objectStore("embeddings");
		await new Promise((resolve, reject) => {
			const r = embeddingStore.clear();
			r.onsuccess = resolve;
			r.onerror = () => reject(r.error);
		});

		for (const [id, embedding] of Object.entries(embeddings.value)) {
			try {
				const plainEmbedding = {
					id,
					embedding: Array.from(embedding),
				};
				await new Promise((resolve, reject) => {
					const r = embeddingStore.put(plainEmbedding);
					r.onsuccess = resolve;
					r.onerror = () => reject(r.error);
				});
			} catch (err) {
				console.error(`❌ EMBEDDING FAILED [${id}]`, embedding, err);
			}
		}

		await new Promise((resolve, reject) => {
			tx.oncomplete = resolve;
			tx.onerror = () => reject(tx.error);
			tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
		});

		console.log("✨ IndexedDB Save Complete");
	} catch (err) {
		console.error("🔥 FATAL IndexedDB SAVE ERROR:", err);
	}
}

async function loadFromIndexedDB() {
	if (!db) return;

	try {
		// Load websites
		const websiteTx = db.transaction("websites", "readonly");
		const websiteStore = websiteTx.objectStore("websites");
		const websiteRequest = websiteStore.getAll();

		websiteRequest.onsuccess = () => {
			for (const website of websiteRequest.result) {
				websites.value[website.id] = website;
			}
		};

		// Load clusters
		const clusterTx = db.transaction("clusters", "readonly");
		const clusterStore = clusterTx.objectStore("clusters");
		const clusterRequest = clusterStore.getAll();

		clusterRequest.onsuccess = () => {
			for (const cluster of clusterRequest.result) {
				clusters.value[cluster.id] = cluster;
			}
		};

		// Load embeddings
		const embeddingTx = db.transaction("embeddings", "readonly");
		const embeddingStore = embeddingTx.objectStore("embeddings");
		const embeddingRequest = embeddingStore.getAll();

		embeddingRequest.onsuccess = () => {
			for (const item of embeddingRequest.result) {
				embeddings.value[item.id] = item.embedding;
			}
		};

		console.log("✅ Loaded data from IndexedDB");
	} catch (err) {
		console.error("Error loading from IndexedDB:", err);
	}
}

// Load models (HYBRID): transformers.js for embeddings + Web-LLM for summarization
async function loadModels() {
	modelLoading.value = true;
	loadingMessage.value = "Loading AI models...";
	downloadProgress.value = 0;

	try {
		// transformers.js
		loadingMessage.value = "Loading embedding model (Transformers.js)...";
		embeddingModel = await pipeline(
			"feature-extraction",
			"Xenova/all-MiniLM-L6-v2",
			{
				progress_callback: (progress) => {
					// keep the first half of the progress for embeddings
					if (progress.status === "downloading") {
						downloadProgress.value = Math.round(
							(progress.loaded / (progress.total || 1)) * 40
						);
					}
				},
			}
		);

		// web-llm
		loadingMessage.value = "Loading summarization model (Web-LLM)...";
		// CreateMLCEngine will download/extract model and set up worker; progress callback mapped to UI
		const webLLMModelName = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";

		summarizationModel = await CreateMLCEngine(webLLMModelName, {
			initProgressCallback: (progress) => {
				// Map Web-LLM progress into remaining progress (40-100)
				if (progress && typeof progress.progress === "number") {
					// Map 0..1 -> 40..100
					downloadProgress.value = 40 + Math.round(progress.progress * 60);
				}
				if (progress && progress.text) {
					loadingMessage.value = progress.text;
				}
			},
		});

		// quick sanity test for summarization LLM
		try {
			await summarizationModel.chat.completions.create({
				messages: [{ role: "user", content: "Say hi" }],
				max_tokens: 5,
				temperature: 0.4,
			});
		} catch (e) {
			// Non-fatal: keep engine but warn
			console.warn("Web-LLM sanity test failed (non-fatal)", e);
		}

		modelLoading.value = false;
		loadingMessage.value = "";
		downloadProgress.value = 0;
		console.log("✅ Models loaded successfully (embeddings + Web-LLM)");
	} catch (err) {
		error.value = `Failed to load models: ${err.message || err}`;
		modelLoading.value = false;
		console.error("❌ Model loading error:", err);
	}
}

// Generate unique ID
function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function setupMessageListener() {
	const listener = (event) => {
		const msg = event.data;

		// make sure it's coming from the extension
		if (!msg || msg.source !== "page-summarizer-extension") return;

		console.log("🎯 Received message:", msg);

		// --- EXISTING HANDLER ---
		if (msg.type === "PAGE_METADATA" && msg.data) {
			processingQueue.value.push(msg.data);
			processQueue();
		}

		// --- NEW HANDLER: EXTENSION WANTS ALBUMS ---
		if (msg.type === "REQUEST_ALBUMS") {
			console.log("📥 Extension requested albums");

			// respond back with albums
			window.postMessage(
				{
					source: "page-summarizer-extension",
					type: "ALBUMS_RESPONSE",
					albums: JSON.parse(JSON.stringify(albums.value)) ?? []
				},
				"*"
			);
		}
	};

	window.addEventListener("message", listener);
	return listener;
}


let messageListener = null;

const handleResize = () => {
	if (svg && graphContainer.value) {
		const width = graphContainer.value.clientWidth;
		const height = graphContainer.value.clientHeight;
		svg.attr("width", width).attr("height", height);
		selectedWebsite.value = null;
	}
};

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
	if (!e.target.closest(".albums-dropdown-container")) {
		showAlbumsDropdown.value = false;
	}
});

watch(
	() => showConnections.value,
	() => {
		toggleConnections();
	}
);

watch(
	() => isDarkMode.value,
	() => {
		updateTheme();
	}
);

onMounted(async () => {
	try {
		window.addEventListener('keydown', handleKeyDown);
		document.addEventListener('click', handleClickOutside);

		platform.value = detectPlatform();

		console.log("🚀 Component mounted, initializing graph...");
		initializeGraph();
		window.addEventListener("resize", handleResize);

		await initDB();
		console.log("✅ IndexedDB ready");

		await loadFromIndexedDB();

		await loadModels();

		await loadData();
		renderGraph();

		// Set up message listener
		messageListener = setupMessageListener();
		console.log("✅ Message listener ready");
	} catch (err) {
		error.value = `Initialization failed: ${err.message || err}`;
		console.error("❌ Init error:", err);
	}
});

onBeforeUnmount(() => {
	console.log("👋 Component unmounting, cleaning up...");
	window.removeEventListener('keydown', handleKeyDown);
	document.removeEventListener('click', handleClickOutside);
	window.removeEventListener("resize", handleResize);
});

onUnmounted(() => {
	if (messageListener) {
		window.removeEventListener("message", messageListener);
	}
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

* {
	font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
		sans-serif;
}

/* Custom Slider Styles */
.slider::-webkit-slider-thumb {
	appearance: none;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: #4a90e2;
	cursor: pointer;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: #4a90e2;
	cursor: pointer;
	border: none;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Animations */
@keyframes fadeIn {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

@keyframes scaleIn {
	from {
		opacity: 0;
		transform: scale(0.95);
	}

	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes slideInRight {
	from {
		opacity: 0;
		transform: translateX(100px);
	}

	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes slideInUp {
	from {
		opacity: 0;
		transform: translateY(100px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.animate-fadeIn {
	animation: fadeIn 0.2s ease-out;
}

.animate-scaleIn {
	animation: scaleIn 0.2s ease-out;
}

.animate-slideInRight {
	animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slideInUp {
	animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* D3 Graph Styles */
:global(.node) {
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

:global(.node:hover) {
	stroke-width: 3px;
	filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

:global(.node.website),
:global(.node.discover) {
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

:global(.node.website:hover),
:global(.node.discover:hover) {
	filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
}

:global(.node.highlighted) {
	stroke: #e74c3c !important;
	stroke-width: 4px;
	filter: drop-shadow(0 0 12px rgba(231, 76, 60, 0.4));
}

:global(.node.connection-highlight) {
	stroke: #4a90e2 !important;
	stroke-width: 3px;
	filter: drop-shadow(0 0 10px rgba(74, 144, 226, 0.3));
}

:global(.node-label) {
	font-family: "Inter", sans-serif;
	font-size: 12px;
	font-weight: 500;
	text-anchor: middle;
	dominant-baseline: central;
	pointer-events: none;
	transition: all 0.3s ease;
}

:global(.node-label.highlighted) {
	font-weight: 700;
	transform: scale(1.1);
}

:global(.link) {
	transition: all 0.3s ease;
}

:global(.link.cluster-link) {
	stroke: #adb5bd;
	stroke-dasharray: 2, 2;
}

:global(.link.website-link),
:global(.link.discover-link) {
	stroke: #adb5bd;
	opacity: 0.6;
}

:global(.link.highlighted) {
	stroke: #4a90e2;
	stroke-width: 2;
	opacity: 0.8 !important;
	stroke-dasharray: none;
}

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>