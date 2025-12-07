<template>
	<div class="w-screen h-screen relative overflow-hidden font-sans transition-all duration-300"
		:style="{ backgroundColor: currentTheme.colors.background }">
		<div class="fixed top-0 left-0 right-0 z-[1000] px-5 py-4"
			:style="{ backgroundColor: currentTheme.colors.background }">
			<div class="flex items-center justify-between max-w-screen-2xl mx-auto">
				<div class="flex items-center gap-4">
					<a href="/" class="flex items-center">
						<img v-if="currentTheme.isDark" src="./images/RocusBlue.png" alt="Rocus" class="h-10 w-auto" />
						<img v-else src="./images/RocusBlue.png" alt="Rocus" class="h-10 w-auto" />
					</a>
				</div>

				<div class="flex-1 max-w-2xl mx-8">
					<div class="relative">
						<button @click.stop="toggleAlbumsDropdown"
							class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 group"
							:style="{
								backgroundColor: currentTheme.colors.surface,
								borderColor: currentTheme.colors.border,
								color: currentTheme.colors.textSecondary
							}" :class="'hover:border-[' + currentTheme.colors.primary + ']'">
							<div class="flex items-center gap-3">
								<img v-if="currentAlbum?.icon" :src="getIconUrl(currentAlbum.icon)" alt="Album icon"
									class="w-8 h-8 object-contain" />
								<img v-else src="./images/RocusFileIconColored.png" alt="Album icon"
									class="w-8 h-8 object-contain" />

								<div class="text-left">
									<div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
										{{ currentAlbum ? currentAlbum.name : 'All Clusters' }}
									</div>
								</div>
							</div>
							<svg class="w-5 h-5 transition-transform duration-200"
								:style="{ color: currentTheme.colors.textSecondary }"
								:class="{ 'rotate-180': showAlbumsDropdown }" fill="none" stroke="currentColor"
								viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						<div v-if="showAlbumsDropdown"
							class="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fadeIn"
							:style="{
								backgroundColor: currentTheme.colors.surface,
								borderColor: currentTheme.colors.border
							}">
							<button @click="selectAlbum(null)"
								class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
								:style="{ color: currentTheme.colors.text }" :class="{
									'bg-[#4A90E2]/10': !currentAlbum,
								}">
								<span class="text-2xl">🌐</span>
								<div class="flex-1 text-left">
									<div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
										All Clusters
									</div>
									<div class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">View
										everything</div>
								</div>
								<svg v-if="!currentAlbum" class="w-5 h-5 text-[#4A90E2]" fill="currentColor"
									viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd" />
								</svg>
							</button>

							<div class="h-px mx-4" :style="{ backgroundColor: currentTheme.colors.border }"></div>

							<div class="max-h-64 overflow-y-auto">
								<button v-for="album in albums" :key="album.id" @click="selectAlbum(album)"
									class="w-full flex items-center gap-3 px-4 py-3 transition-colors group" :class="{
										'bg-[#4A90E2]/10': currentAlbum?.id === album.id,
									}">
									<img :src="getIconUrl(album.icon)" alt="Album icon"
										class="w-8 h-8 object-contain" />
									<div class="flex-1 text-left">
										<div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
											{{ album.name }}
										</div>
									</div>
									<div class="flex items-center gap-2">
										<svg v-if="currentAlbum?.id === album.id" class="w-5 h-5 text-[#4A90E2]"
											fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd" />
										</svg>
										<button @click.stop="editAlbum(album)"
											class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
											:style="{ color: currentTheme.colors.textSecondary }">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

							<div class="h-px mx-4" :style="{ backgroundColor: currentTheme.colors.border }"></div>

							<button @click="createNewAlbum"
								class="w-full flex items-center gap-3 px-4 py-3 transition-colors text-[#4A90E2] font-medium">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M12 4v16m8-8H4" />
								</svg>
								<span class="text-sm">Create New Album</span>
							</button>
						</div>
					</div>

					<div class="fixed top-24 left-1/2 transform -translate-x-1/2 transition-all duration-300"
						:class="{ 'scale-105': isSearchFocused }">
						<div @click="focusSearch"
							class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 cursor-text group"
							:style="{
								backgroundColor: isSearchFocused ? currentTheme.colors.surface : currentTheme.colors.background,
							}">

							<svg class="w-5 h-5 transition-colors duration-200"
								:style="{ color: isSearchFocused ? currentTheme.colors.primary : currentTheme.colors.textSecondary }"
								fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>

							<input ref="searchInputRef" v-model="searchInput" @input="performSearch"
								@focus="isSearchFocused = true" @blur="handleSearchBlur" type="text"
								placeholder="Search clusters, websites, domains..."
								class="bg-transparent border-none focus:outline-none focus:ring-0 outline-none w-80 placeholder-gray-400 transition-all duration-200"
								:style="{ color: currentTheme.colors.text }" />

							<button v-if="searchInput" @click="clearSearch"
								class="p-1.5 rounded-full transition-all duration-200 flex-shrink-0"
								:style="{ color: currentTheme.colors.textSecondary }">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd" />
								</svg>
							</button>

							<div class="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 flex-shrink-0 border"
								:style="{
									backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
									borderColor: currentTheme.colors.border
								}">

								<span class="text-xs font-medium tracking-wider"
									:style="{ color: currentTheme.colors.textSecondary }">
									ESC
								</span>
							</div>

							<!-- <div v-if="showContextMenu" @click.stop
								class="fixed z-[2500] rounded-xl shadow-2xl border overflow-hidden min-w-[200px] animate-scaleIn"
								:style="{
									...contextMenuStyle,
									backgroundColor: currentTheme.colors.surface,
									borderColor: currentTheme.colors.border
								}">

								{{ matchCount }}
							</div> -->
						</div>
					</div>

				</div>

				<div class="flex items-center gap-3">
					<button @click="toggleThemes" class="p-2.5 rounded-xl transition-all"
						:style="{ backgroundColor: currentTheme.colors.surface }">
						<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
						</svg>
					</button>

					<button @click="toggleSettings" class="p-2.5 rounded-xl transition-all"
						:style="{ backgroundColor: currentTheme.colors.surface }">
						<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</button>

					<button @click="toggleModelStatus" class="relative p-2.5 rounded-xl transition-all"
						:style="{ backgroundColor: currentTheme.colors.surface }">
						<svg v-if="modelLoading" class="w-5 h-5 text-[#4A90E2] animate-spin" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<svg v-else-if="!error" class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }"
							fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						<svg v-else class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<div v-if="!modelLoading && !error"
							class="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2"
							:style="{ borderColor: currentTheme.colors.surface }">
						</div>
						<div v-if="processingQueue.length > 0"
							class="absolute top-1 right-1 w-2 h-2 bg-[#4A90E2] rounded-full border-2 animate-pulse"
							:style="{ borderColor: currentTheme.colors.surface }">
						</div>
					</button>

					<button @click="handleProfileClick" class="p-2.5 rounded-xl transition-all"
						:style="{ backgroundColor: currentTheme.colors.surface }">
						<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<div v-if="isLoading"
			class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[3000] flex items-center justify-center">
			<div class="border rounded-3xl p-10 text-center shadow-2xl max-w-sm" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<div class="w-16 h-16 mx-auto mb-6 border-4 border-t-[#4A90E2] rounded-full animate-spin"
					:style="{ borderColor: currentTheme.colors.border, borderTopColor: currentTheme.colors.primary }">
				</div>
				<p class="text-lg font-medium" :style="{ color: currentTheme.colors.text }">
					Loading clusters...
				</p>
			</div>
		</div>

		<div v-if="showAlbumModal" @click="closeAlbumModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					{{ editingAlbum ? "Edit Album" : "Create New Album" }}
				</h3>

				<div class="space-y-5">
					<div>
						<label class="block text-sm font-medium mb-2"
							:style="{ color: currentTheme.colors.textSecondary }">Album
							Name</label>
						<input v-model="albumForm.name" type="text" placeholder="My Collection"
							class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none transition-all"
							:style="{
								backgroundColor: currentTheme.colors.background,
								borderColor: currentTheme.colors.border,
								color: currentTheme.colors.text
							}" />
					</div>

					<div>
						<label class="block text-sm font-medium mb-2"
							:style="{ color: currentTheme.colors.textSecondary }">Icon</label>
						<div class="flex gap-2">
							<button v-for="(icon, index) in iconOptions" :key="icon" @click="albumForm.icon = icon"
								class="p-3 rounded-xl transition-all" :class="{
									'bg-[#4A90E2]/20 ring-2 ring-[#4A90E2]':
										albumForm.icon === icon,
								}">
								<img :src="iconUrls[index]" alt="icon" class="w-8 h-8 object-contain" />
							</button>
						</div>
					</div>
				</div>

				<div class="flex gap-3 mt-8">
					<button @click="closeAlbumModal" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
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
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
						Settings
					</h3>
					<button @click="closeSettings" class="p-2 rounded-xl transition-all">
						<svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<!-- <div>
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								Dark Mode
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">Toggle dark theme
							</div>
						</div> -->
						<!-- <button @click="toggleDarkMode" class="relative w-14 h-8 rounded-full transition-all"
							:class="currentTheme.isDark ? 'bg-[#4A90E2]' : 'bg-gray-300'">
							<div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
								:class="{ 'translate-x-6': currentTheme.isDark }"></div>
						</button> -->
					</div>

					<div class="flex items-center justify-between">
						<div>
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								Show Connections
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">Display cluster
								links</div>
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

					<!-- In Settings Modal, add after Show Connections -->
					<div class="h-px" :style="{ backgroundColor: currentTheme.colors.border }"></div>

					<div class="space-y-4 pt-4">
						<div class="font-medium" :style="{ color: currentTheme.colors.text }">
							Data Management
						</div>

						<button @click="exportAllData"
							class="w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
							:style="{
								backgroundColor: currentTheme.colors.background,
								color: currentTheme.colors.text,
								border: `1px solid ${currentTheme.colors.border}`
							}">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Export All Data
						</button>

						<button @click="triggerImport"
							class="w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
							:style="{
								backgroundColor: currentTheme.colors.background,
								color: currentTheme.colors.text,
								border: `1px solid ${currentTheme.colors.border}`
							}">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
							</svg>
							Import Data
						</button>
						<input ref="importFileInput" type="file" accept=".rocus" style="display: none"
							@change="handleImport" />
					</div>
				</div>

				<button @click="resetSettings" class="w-full mt-8 px-6 py-3 rounded-xl font-medium transition-all"
					:style="{
						backgroundColor: currentTheme.colors.background,
						color: currentTheme.colors.textSecondary
					}">
					Reset to Default
				</button>
			</div>
		</div>

		<!-- Theme Picker Modal -->
		<div v-if="showThemes" @click="closeThemes"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="border rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">

				<div class="flex justify-between items-center mb-6">
					<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
						Theme Picker
					</h3>
					<button @click="closeThemes" class="p-2 rounded-xl transition-all">
						<svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="grid grid-cols-1 gap-3">
					<button v-for="theme in themes" :key="theme.id" @mouseenter="previewTheme(theme)"
						@click="applyTheme(theme)"
						class="group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all" :class="[
							currentTheme.id === theme.id
								? 'border-[#4A90E2] bg-blue-50 dark:bg-blue-900/20'
								: 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
						]" :style="{ backgroundColor: currentTheme.id === theme.id ? 'rgba(74, 144, 226, 0.1)' : currentTheme.colors.background }">

						<div class="flex gap-2">
							<div v-for="(color, index) in theme.preview" :key="index"
								class="w-10 h-10 rounded-lg shadow-sm border border-black/10"
								:style="{ backgroundColor: color }">
							</div>
						</div>

						<div class="flex-1 text-left">
							<div class="font-semibold" :style="{ color: currentTheme.colors.text }">
								{{ theme.name }}
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
								{{ theme.description }}
							</div>
						</div>

						<svg v-if="currentTheme.id === theme.id" class="w-6 h-6 text-[#4A90E2] flex-shrink-0"
							fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<div class="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3">
			<button @click="resetView" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border group"
				:style="{
					backgroundColor: currentTheme.colors.background,
					borderColor: currentTheme.colors.border
				}">
				<svg class="w-5 h-5 group-hover:text-[#4A90E2] transition-colors"
					:style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
					viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
				</svg>
			</button>
			<button @click="refreshData" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border group"
				:style="{
					backgroundColor: currentTheme.colors.background,
					borderColor: currentTheme.colors.border
				}">
				<svg class="w-5 h-5 group-hover:text-[#4A90E2] transition-colors"
					:style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
					viewBox="0 0 24 24">
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
			class="fixed pointer-events-none opacity-0 transition-opacity duration-200 z-[2000] px-4 py-3 text-sm rounded-xl shadow-xl max-w-xs backdrop-blur-sm"
			:style="{
				backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.95)',
				color: currentTheme.isDark ? '#000' : '#fff'
			}">
		</div>

		<!-- Context Menu -->
		<div v-if="showContextMenu" @click.stop
			class="fixed z-[2500] rounded-xl shadow-2xl border overflow-hidden min-w-[200px] animate-scaleIn" :style="{
				...contextMenuStyle,
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">

			<button @click="renameCluster" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
				<span class="text-sm font-medium">Rename Cluster</span>
			</button>

			<button @click="showAddWebsitesModal" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				<span class="text-sm font-medium">Add Websites</span>
			</button>

			<button @click="showRemoveWebsitesModal" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span class="text-sm font-medium">Remove Websites</span>
			</button>

			<div class="h-px mx-2" :style="{ backgroundColor: currentTheme.colors.border }"></div>

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
			<div @click.stop class="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn border" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Rename Cluster
				</h3>
				<input v-model="renameInput" @keyup.enter="confirmRename" type="text" placeholder="New cluster name"
					class="w-full px-4 py-3 border rounded-xl outline-none transition-all" :style="{
						backgroundColor: currentTheme.colors.background,
						borderColor: currentTheme.colors.border,
						color: currentTheme.colors.text
					}" />
				<div class="flex gap-3 mt-6">
					<button @click="closeRenameModal" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
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
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Add Websites to Cluster
				</h3>
				<div class="space-y-2 mb-6">
					<div v-for="website in availableWebsites" :key="website.id"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
						:class="selectedWebsitesToAdd.includes(website.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''"
						:style="{
							borderColor: selectedWebsitesToAdd.includes(website.id) ? currentTheme.colors.primary : currentTheme.colors.border
						}" @click="toggleWebsiteSelection(website.id)">
						<input type="checkbox" :checked="selectedWebsitesToAdd.includes(website.id)" class="w-4 h-4" />
						<div class="flex-1">
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								{{ website.title }}
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">{{ website.domain
							}}</div>
						</div>
					</div>
				</div>
				<div class="flex gap-3">
					<button @click="closeAddWebsitesModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
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
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Remove Websites from Cluster
				</h3>
				<div class="space-y-2 mb-6">
					<div v-for="websiteId in contextCluster?.websites" :key="websiteId"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
						:class="selectedWebsitesToRemove.includes(websiteId) ? 'bg-red-50 dark:bg-red-900/20' : ''"
						:style="{
							borderColor: selectedWebsitesToRemove.includes(websiteId) ? '#ef4444' : currentTheme.colors.border
						}" @click="toggleRemoveSelection(websiteId)">
						<input type="checkbox" :checked="selectedWebsitesToRemove.includes(websiteId)"
							class="w-4 h-4" />
						<div class="flex-1">
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								{{ websites[websiteId]?.title }}
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">{{
								websites[websiteId]?.domain
							}}</div>
						</div>
					</div>
				</div>
				<div class="flex gap-3">
					<button @click="closeRemoveWebsitesModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
					<button @click="confirmRemoveWebsites(false)"
						class="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all">
						Remove from Cluster
					</button>
					<button @click="confirmRemoveWebsites(true)"
						class="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all">
						Delete Entirely
					</button>
				</div>
			</div>
		</div>

		<div v-if="selectedWebsite" :style="stickyNoteStyle" @click.stop
			class="fixed z-[1500] rounded-2xl shadow-2xl min-w-[320px] max-w-md animate-scaleIn bg-yellow-100">
			<div @mousedown="startDraggingSticky"
				class="flex justify-between items-center p-4 cursor-move border-b border-yellow-200">
				<h4 class="font-semibold text-base truncate pr-4 text-gray-900">
					{{ selectedWebsite.title }}
				</h4>

				<button @click="closeStickyNote"
					class="p-1.5 rounded-lg hover:bg-yellow-200 transition-all flex-shrink-0">
					<svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-4 space-y-3 text-sm text-gray-800">
				<!-- <div>
					<span class="font-semibold">Cluster ID:</span>
					{{ selectedWebsite.parentCluster }}
				</div> -->

				<div>
					<span class="font-semibold">Domain:</span>
					{{ selectedWebsite.domain }}
				</div>

				<div v-if="websiteDetails">
					<span class="font-semibold">Description:</span>
					{{ websiteDetails.ai_summary || "None" }}
				</div>

				<a :href="selectedWebsite.url" target="_blank" class="cursor-pointer transition-all hover:shadow-md"
					:class="isDarkMode ? 'border-gray-700 bg-[#212121]' : 'border-gray-300 bg-white'">
					<!-- Image -->
					<div v-if="websiteDetails?.metadata?.image"
						class="w-full my-4 h-36 mb-2 overflow-hidden rounded-lg">
						<img :src="websiteDetails.metadata.image" class="w-full h-full object-cover" alt="preview" />
					</div>

					<!-- Title -->
					<div class="font-semibold text-sm" :class="isDarkMode ? 'text-gray-800' : 'text-gray-700'">
						{{ websiteDetails?.metadata?.title || selectedWebsite.domain }}
					</div>

					<!-- Description -->
					<div class="text-xs mt-1 line-clamp-2" :class="isDarkMode ? 'text-gray-700' : 'text-gray-700'">
						{{ websiteDetails?.metadata?.description || "No description available" }}
					</div>

					<!-- Domain -->
					<div class="text-xs mt-2 flex items-center gap-1"
						:class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
						🌐 {{ selectedWebsite.domain }}
					</div>
				</a>


				<a :href="selectedWebsite.url" target="_blank"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-[#212121] hover:bg-black text-white">
					🔗 Visit Website
				</a>

				<div v-if="selectedWebsite.processed_at" class="text-xs text-gray-600">
					<span class="font-semibold">Processed:</span>
					{{ formatDate(selectedWebsite.processed_at) }}
				</div>
			</div>
		</div>

		<div v-if="showDiscoverModal" @click="closeDiscoverModal"
			class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto border"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<div class="flex justify-between items-center mb-6">
					<div>
						<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
							Discover Similar Websites
						</h3>
						<p class="text-sm mt-1" :style="{ color: currentTheme.colors.textSecondary }">
							Found {{ similarWebsites.length }} websites related to
							<strong>{{ explodedNode?.topic }}</strong>
						</p>
					</div>

					<button @click="closeDiscoverModal" class="p-2 rounded-xl transition-all">
						<svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div v-if="isLoadingSimilar" class="flex flex-col items-center justify-center py-16">
					<div class="w-12 h-12 border-4 border-t-[#4A90E2] rounded-full animate-spin mb-4"
						:style="{ borderColor: currentTheme.colors.border, borderTopColor: currentTheme.colors.primary }">
					</div>

					<p :style="{ color: currentTheme.colors.textSecondary }">
						Searching the web...
					</p>
				</div>

				<div v-else-if="similarWebsites.length > 0" class="space-y-3">
					<button v-for="(website, index) in similarWebsites" :key="index"
						@click="openExternalLink(website.url)"
						class="w-full flex items-start gap-4 p-4 rounded-2xl transition-all group border" :style="{
							backgroundColor: currentTheme.colors.background,
							borderColor: currentTheme.colors.border
						}">
						<div class="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-[#4A90E2]"
							:style="{ backgroundColor: currentTheme.colors.surface }">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						</div>

						<div class="flex-1 min-w-0 text-left">
							<h4 class="font-semibold truncate" :style="{ color: currentTheme.colors.text }">
								{{ website.title }}
							</h4>

							<p class="text-xs mt-1 truncate text-[#4A90E2]">
								{{ website.domain || new URL(website.url).hostname }}
							</p>

							<p class="text-sm mt-2 line-clamp-2" :style="{ color: currentTheme.colors.textSecondary }">
								{{
									website.snippet ||
									website.description ||
									"No description available"
								}}
							</p>
						</div>

						<svg class="w-5 h-5 flex-shrink-0 transition-all group-hover:translate-x-1 group-hover:text-[#4A90E2]"
							:style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
							viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
					</button>
				</div>

				<div v-else class="flex flex-col items-center justify-center py-16">
					<svg class="w-16 h-16 mb-4 opacity-50" :style="{ color: currentTheme.colors.textSecondary }"
						fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<circle cx="11" cy="11" r="8" stroke-width="2"></circle>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35" />
					</svg>

					<p :style="{ color: currentTheme.colors.textSecondary }">
						No similar websites found
					</p>
				</div>
			</div>
		</div>

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

		<div class="fixed bottom-8 left-8 z-[1000] px-4 py-2 backdrop-blur-xl rounded-xl text-xs border" :style="{
			backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
			color: currentTheme.colors.textSecondary,
			borderColor: currentTheme.colors.border
		}">
			Mouse wheel to zoom • Click and drag to pan • Click clusters to explode
		</div>

		<button @click="showVersionHistory = true"
			class="fixed bottom-8 right-24 z-[1000] px-3 py-2 rounded-lg text-xs font-mono transition-all" :style="{
				backgroundColor: currentTheme.colors.surface,
				color: currentTheme.colors.textSecondary,
				border: `1px solid ${currentTheme.colors.border}`
			}">
			v1.0.0
		</button>

		<button @click="startTutorial" class="fixed top-6 left-10 z-[1000] p-2.5 rounded-xl opacity-30 transition-all"
			:style="{
				backgroundColor: currentTheme.colors.surface,
				border: `1px solid ${currentTheme.colors.border}`
			}">
			<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
				viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>

		<div v-if="tutorialActive" class="fixed inset-0 z-[3000]">
			<svg class="absolute inset-0 w-full h-full pointer-events-none">
				<defs>
					<mask id="tutorial-mask">
						<rect x="0" y="0" width="100%" height="100%" fill="white" />
						<rect v-if="tutorialHighlightRect.width" :x="tutorialHighlightRect.left - 8"
							:y="tutorialHighlightRect.top - 8" :width="tutorialHighlightRect.width + 16"
							:height="tutorialHighlightRect.height + 16" rx="12" fill="black" />
					</mask>
				</defs>
				<rect x="0" y="0" width="100%" height="100%" fill="black" :opacity="0.85" mask="url(#tutorial-mask)" />
			</svg>

			<div v-if="tutorialHighlightRect.width"
				class="absolute pointer-events-none transition-all duration-500 animate-pulse" :style="{
					top: `${tutorialHighlightRect.top - 8}px`,
					left: `${tutorialHighlightRect.left - 8}px`,
					width: `${tutorialHighlightRect.width + 16}px`,
					height: `${tutorialHighlightRect.height + 16}px`,
					border: `3px solid ${currentTheme.colors.primary}`,
					borderRadius: '12px',
					boxShadow: `0 0 0 4px ${currentTheme.colors.primary}40, 0 0 20px ${currentTheme.colors.primary}`
				}">
			</div>

			<!-- Tutorial Content Card -->
			<div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
				:class="{ 'top-1/2 -translate-y-1/2 bottom-auto': !tutorialSteps[tutorialStep]?.highlight }">
				<div class="rounded-3xl p-6 max-w-xl w-[90vw] shadow-2xl animate-scaleIn" :style="{
					backgroundColor: currentTheme.colors.surface,
					border: `2px solid ${currentTheme.colors.primary}`
				}">

					<!-- Progress Bar -->
					<div class="mb-4">
						<div class="flex justify-between mb-2">
							<span class="text-xs font-semibold" :style="{ color: currentTheme.colors.textSecondary }">
								Step {{ tutorialStep + 1 }} of {{ tutorialSteps.length }}
							</span>
							<span class="text-xs font-semibold" :style="{ color: currentTheme.colors.primary }">
								{{ Math.round(((tutorialStep + 1) / tutorialSteps.length) * 100) }}%
							</span>
						</div>
						<div class="h-1.5 rounded-full overflow-hidden"
							:style="{ backgroundColor: currentTheme.colors.border }">
							<div class="h-full rounded-full transition-all duration-500" :style="{
								width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%`,
								backgroundColor: currentTheme.colors.primary
							}">
							</div>
						</div>
					</div>

					<!-- Step Title -->
					<h3 class="text-xl font-bold mb-3" :style="{ color: currentTheme.colors.text }">
						{{ tutorialSteps[tutorialStep]?.title }}
					</h3>

					<!-- Step Description -->
					<p class="mb-6 leading-relaxed text-sm" :style="{ color: currentTheme.colors.textSecondary }">
						{{ tutorialSteps[tutorialStep]?.description }}
					</p>

					<!-- Navigation Buttons -->
					<div class="flex gap-3">
						<button v-if="tutorialStep > 0" @click="previousTutorialStep"
							class="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all text-sm" :style="{
								backgroundColor: currentTheme.colors.background,
								color: currentTheme.colors.textSecondary
							}">
							Previous
						</button>
						<button @click="nextTutorialStep"
							class="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all text-sm" :style="{
								backgroundColor: currentTheme.colors.primary,
								color: '#fff'
							}">
							{{ tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next' }}
						</button>
					</div>

					<!-- Skip Button -->
					<button @click="skipTutorial" class="w-full mt-3 text-xs transition-all hover:opacity-70"
						:style="{ color: currentTheme.colors.textSecondary }">
						Skip Tutorial
					</button>
				</div>
			</div>
		</div>

		<div v-if="showVersionHistory" @click="showVersionHistory = false"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="border rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">

				<div class="flex justify-between items-center mb-6">
					<div>
						<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
							Version History
						</h3>
						<p class="text-sm mt-1" :style="{ color: currentTheme.colors.textSecondary }">
							Current version: v1.0.0
						</p>
					</div>
					<button @click="showVersionHistory = false" class="p-2 rounded-xl transition-all">
						<svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="space-y-6">
					<div v-for="version in versionHistory" :key="version.version" class="p-4 rounded-xl transition-all"
						:style="{
							backgroundColor: currentTheme.colors.background,
							borderLeft: `4px solid ${currentTheme.colors.primary}`
						}">
						<div class="flex items-start justify-between mb-3">
							<div>
								<h4 class="text-lg font-bold" :style="{ color: currentTheme.colors.text }">
									{{ version.version }}
								</h4>
								<p class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
									{{ version.date }}
								</p>
							</div>
							<span class="px-3 py-1 rounded-full text-xs font-semibold" :style="{
								backgroundColor: version.current ? currentTheme.colors.primary : currentTheme.colors.border,
								color: version.current ? '#fff' : currentTheme.colors.textSecondary
							}">
								{{ version.current ? 'Current' : 'Previous' }}
							</span>
						</div>

						<div v-if="version.features.length" class="mb-3">
							<p class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
								Features
							</p>
							<ul class="space-y-1">
								<li v-for="feature in version.features" :key="feature"
									class="text-sm flex items-start gap-2"
									:style="{ color: currentTheme.colors.textSecondary }">
									<span class="text-green-500">•</span>
									<span>{{ feature }}</span>
								</li>
							</ul>
						</div>

						<div v-if="version.improvements.length" class="mb-3">
							<p class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
								Improvements
							</p>
							<ul class="space-y-1">
								<li v-for="improvement in version.improvements" :key="improvement"
									class="text-sm flex items-start gap-2"
									:style="{ color: currentTheme.colors.textSecondary }">
									<span class="text-blue-500">•</span>
									<span>{{ improvement }}</span>
								</li>
							</ul>
						</div>

						<div v-if="version.bugFixes.length">
							<p class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
								Bug Fixes
							</p>
							<ul class="space-y-1">
								<li v-for="fix in version.bugFixes" :key="fix" class="text-sm flex items-start gap-2"
									:style="{ color: currentTheme.colors.textSecondary }">
									<span class="text-red-500">•</span>
									<span>{{ fix }}</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
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
const showThemes = ref(false);
const currentTheme = ref({
	id: 'default-light',
	name: 'Default Light',
	isDark: false,
	colors: {
		background: '#f4f4f4',
		surface: '#ffffff',
		primary: '#4A90E2',
		secondary: '#357ABD',
		accent: '#4A90E2',
		node: '#f4f4f4',
		nodeStroke: '#d1d5db',
		text: '#000000',
		textSecondary: '#6b7280',
		border: '#e5e7eb'
	}
});

const themeClasses = computed(() => ({
	surface: currentTheme.value.isDark ? 'bg-black' : 'bg-white',
	surfaceHover: currentTheme.value.isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-50',
	border: currentTheme.value.isDark ? 'border-gray-800' : 'border-gray-200',
	text: currentTheme.value.isDark ? 'text-white' : 'text-gray-900',
	textSecondary: currentTheme.value.isDark ? 'text-gray-400' : 'text-gray-600',
	buttonBg: currentTheme.value.isDark ? 'bg-black' : 'bg-white',
	buttonHover: currentTheme.value.isDark ? 'hover:bg-[#212121]' : 'hover:bg-gray-100',
}));

const themes = [
	{
		id: 'default-light',
		name: 'Default Light',
		description: 'Clean and minimal',
		isDark: false,
		preview: ['#f4f4f4', '#4A90E2', '#ffffff', '#e5e7eb'],
		colors: {
			background: '#f4f4f4',
			surface: '#ffffff',
			primary: '#4A90E2',
			secondary: '#357ABD',
			accent: '#4A90E2',
			node: '#f4f4f4',
			nodeStroke: '#d1d5db',
			text: '#000000',
			textSecondary: '#6b7280',
			border: '#e5e7eb'
		}
	},
	{
		id: 'default-dark',
		name: 'Default Dark',
		description: 'Easy on the eyes',
		isDark: true,
		preview: ['#212121', '#374151', '#4A90E2', '#1f2937'],
		colors: {
			background: '#212121',
			surface: '#000000',
			primary: '#4A90E2',
			secondary: '#357ABD',
			accent: '#4A90E2',
			node: '#374151',
			nodeStroke: '#4b5563',
			text: '#ffffff',
			textSecondary: '#9ca3af',
			border: '#374151'
		}
	},
	{
		id: 'nord',
		name: 'Nord',
		description: 'Arctic, north-bluish',
		isDark: true,
		preview: ['#2E3440', '#88C0D0', '#5E81AC', '#4C566A'],
		colors: {
			background: '#2E3440',
			surface: '#3B4252',
			primary: '#88C0D0',
			secondary: '#5E81AC',
			accent: '#88C0D0',
			node: '#4C566A',
			nodeStroke: '#434C5E',
			text: '#ECEFF4',
			textSecondary: '#D8DEE9',
			border: '#434C5E'
		}
	},
	{
		id: 'dracula',
		name: 'Dracula',
		description: 'Dark theme for vampires',
		isDark: true,
		preview: ['#282A36', '#FF79C6', '#BD93F9', '#44475A'],
		colors: {
			background: '#282A36',
			surface: '#1e1f29',
			primary: '#FF79C6',
			secondary: '#BD93F9',
			accent: '#FF79C6',
			node: '#44475A',
			nodeStroke: '#6272A4',
			text: '#F8F8F2',
			textSecondary: '#C5C8C6',
			border: '#44475A'
		}
	},
	{
		id: 'monokai',
		name: 'Monokai',
		description: 'Vibrant and colorful',
		isDark: true,
		preview: ['#272822', '#F92672', '#A6E22E', '#49483E'],
		colors: {
			background: '#272822',
			surface: '#1e1f1c',
			primary: '#F92672',
			secondary: '#A6E22E',
			accent: '#FD971F',
			node: '#49483E',
			nodeStroke: '#75715E',
			text: '#F8F8F2',
			textSecondary: '#CFCFC2',
			border: '#49483E'
		}
	},
	{
		id: 'gruvbox-light',
		name: 'Gruvbox Light',
		description: 'Retro groove, light variant',
		isDark: false,
		preview: ['#FBF1C7', '#458588', '#CC241D', '#EBDBB2'],
		colors: {
			background: '#FBF1C7',
			surface: '#F9F5D7',
			primary: '#458588',
			secondary: '#CC241D',
			accent: '#D65D0E',
			node: '#EBDBB2',
			nodeStroke: '#D5C4A1',
			text: '#3C3836',
			textSecondary: '#665C54',
			border: '#D5C4A1'
		}
	},
	{
		id: 'gruvbox-dark',
		name: 'Gruvbox Dark',
		description: 'Retro groove, dark variant',
		isDark: true,
		preview: ['#282828', '#458588', '#CC241D', '#3C3836'],
		colors: {
			background: '#282828',
			surface: '#1d2021',
			primary: '#458588',
			secondary: '#CC241D',
			accent: '#D65D0E',
			node: '#3C3836',
			nodeStroke: '#504945',
			text: '#EBDBB2',
			textSecondary: '#BDAE93',
			border: '#504945'
		}
	},
	{
		id: 'solarized-light',
		name: 'Solarized Light',
		description: 'Precision colors',
		isDark: false,
		preview: ['#FDF6E3', '#268BD2', '#DC322F', '#EEE8D5'],
		colors: {
			background: '#FDF6E3',
			surface: '#EEE8D5',
			primary: '#268BD2',
			secondary: '#2AA198',
			accent: '#D33682',
			node: '#EEE8D5',
			nodeStroke: '#93A1A1',
			text: '#657B83',
			textSecondary: '#839496',
			border: '#93A1A1'
		}
	},
	{
		id: 'solarized-dark',
		name: 'Solarized Dark',
		description: 'Precision colors for night',
		isDark: true,
		preview: ['#002B36', '#268BD2', '#DC322F', '#073642'],
		colors: {
			background: '#002B36',
			surface: '#073642',
			primary: '#268BD2',
			secondary: '#2AA198',
			accent: '#D33682',
			node: '#073642',
			nodeStroke: '#586E75',
			text: '#839496',
			textSecondary: '#93A1A1',
			border: '#586E75'
		}
	},
	{
		id: 'github-light',
		name: 'GitHub Light',
		description: 'Clean and professional',
		isDark: false,
		preview: ['#FFFFFF', '#0366D6', '#28A745', '#F6F8FA'],
		colors: {
			background: '#FFFFFF',
			surface: '#F6F8FA',
			primary: '#0366D6',
			secondary: '#28A745',
			accent: '#0366D6',
			node: '#F6F8FA',
			nodeStroke: '#E1E4E8',
			text: '#24292E',
			textSecondary: '#586069',
			border: '#E1E4E8'
		}
	},
	{
		id: 'github-dark',
		name: 'GitHub Dark',
		description: 'Easy on the eyes, professional',
		isDark: true,
		preview: ['#0D1117', '#58A6FF', '#3FB950', '#161B22'],
		colors: {
			background: '#0D1117',
			surface: '#161B22',
			primary: '#58A6FF',
			secondary: '#3FB950',
			accent: '#58A6FF',
			node: '#161B22',
			nodeStroke: '#30363D',
			text: '#C9D1D9',
			textSecondary: '#8B949E',
			border: '#30363D'
		}
	},
	{
		id: 'tokyo-night',
		name: 'Tokyo Night',
		description: 'A clean dark theme',
		isDark: true,
		preview: ['#1A1B26', '#7AA2F7', '#BB9AF7', '#24283B'],
		colors: {
			background: '#1A1B26',
			surface: '#24283B',
			primary: '#7AA2F7',
			secondary: '#BB9AF7',
			accent: '#7DCFFF',
			node: '#24283B',
			nodeStroke: '#414868',
			text: '#C0CAF5',
			textSecondary: '#A9B1D6',
			border: '#414868'
		}
	},
	{
		id: 'catppuccin-mocha',
		name: 'Catppuccin Mocha',
		description: 'Soothing pastel theme',
		isDark: true,
		preview: ['#1E1E2E', '#89B4FA', '#F5C2E7', '#313244'],
		colors: {
			background: '#1E1E2E',
			surface: '#181825',
			primary: '#89B4FA',
			secondary: '#F5C2E7',
			accent: '#CBA6F7',
			node: '#313244',
			nodeStroke: '#45475A',
			text: '#CDD6F4',
			textSecondary: '#BAC2DE',
			border: '#45475A'
		}
	},
	{
		id: 'rose-pine',
		name: 'Rosé Pine',
		description: 'All natural pine, faux fur and a bit of soho vibes',
		isDark: true,
		preview: ['#191724', '#EBBCBA', '#9CCFD8', '#26233A'],
		colors: {
			background: '#191724',
			surface: '#1F1D2E',
			primary: '#EBBCBA',
			secondary: '#9CCFD8',
			accent: '#C4A7E7',
			node: '#26233A',
			nodeStroke: '#403D52',
			text: '#E0DEF4',
			textSecondary: '#908CAA',
			border: '#403D52'
		}
	},
	{
		id: 'everforest',
		name: 'Everforest',
		description: 'Comfortable & pleasant',
		isDark: true,
		preview: ['#2D353B', '#A7C080', '#D699B6', '#343F44'],
		colors: {
			background: '#2D353B',
			surface: '#232A2E',
			primary: '#A7C080',
			secondary: '#7FBBB3',
			accent: '#D699B6',
			node: '#343F44',
			nodeStroke: '#3D484D',
			text: '#D3C6AA',
			textSecondary: '#859289',
			border: '#3D484D'
		}
	}
];

const clusters = ref({});
const websites = ref({});
const embeddings = ref({}); // Store embeddings separately for cosine similarity

const processingQueue = ref([]);
const processedCount = ref(0);
const isProcessing = ref(false);

const importFileInput = ref(null); // file import
const showVersionHistory = ref(false);

const versionHistory = [
	{
		version: 'v1.0.0',
		date: 'December 7th 2025',
		current: true,
		features: [
			'AI-powered website clustering with local ML models',
			'Album organization system for managing clusters',
			'Theme picker with 15+ beautiful themes',
			'Real-time search and node highlighting',
			'Context menu for cluster operations (rename, delete, add/remove websites)',
			'Import/Export functionality for data backup',
			'Browser extension for quick website saving',
			'Similar website discovery using Google Search API',
		],
		improvements: [
			'Smooth node explosion/collapse animations',
			'Persistent dark mode and theme preferences',
			'Responsive graph layout with auto-centering',
			'IndexedDB for local data storage',
			'Album-based cluster isolation',
		],
		bugFixes: [
			'Fixed node positioning on graph edges',
			'Fixed theme consistency across interactions',
			'Fixed album update errors with IndexedDB',
			'Fixed search highlighting state management',
		]
	}
];

const tutorialActive = ref(false);
const tutorialStep = ref(0);
const tutorialHighlightRect = ref({ top: 0, left: 0, width: 0, height: 0 });
const tutorialDemoCluster = ref(null);


const tutorialSteps = [
	{
		title: 'Welcome to Rocus',
		description: 'Rocus automatically organizes your saved websites using AI. Let\'s walk through how it works.',
		highlight: null,
		action: null
	},
	{
		title: 'AI Models Loading',
		description: 'Rocus uses local AI models that run in your browser. They download once and work offline. The indicator shows green when models are ready to process websites.',
		highlight: 'model-status',
		action: null
	},
	{
		title: 'Browser Extension',
		description: 'Install the Rocus extension to save websites. Click the extension icon, select an album (or quick save), and Rocus will automatically cluster similar content.',
		highlight: null,
		action: null
	},
	{
		title: 'Albums',
		description: 'Create albums to organize your clusters by topic, project, or any way you like. Click here to switch between albums or view all clusters at once.',
		highlight: 'albums-dropdown',
		action: null
	},
	{
		title: 'Understanding Clusters',
		description: 'Each circle (node) represents a topic of similar websites. Larger nodes contain more websites. The graph shows how different topics relate to each other.',
		highlight: 'demo-cluster',
		action: 'showDemoCluster'
	},
	{
		title: 'Exploring Clusters',
		description: 'Click any cluster to "explode" it and see the individual websites inside. Try clicking the highlighted cluster now!',
		highlight: 'demo-cluster',
		action: 'explodeDemoCluster'
	},
	{
		title: 'Customization',
		description: 'Click the theme button to choose from 15+ beautiful color schemes. Your preferences are saved automatically for next time.',
		highlight: 'theme-button',
		action: null
	},
	{
		title: 'Search & Organize',
		description: 'Use the search bar to find clusters and websites instantly. Right-click any cluster to rename, add websites, remove items, or discover similar content online.',
		highlight: 'search-bar',
		action: null
	},
	{
		title: 'You\'re All Set!',
		description: 'Start saving websites with the extension and watch Rocus organize them automatically. Your intelligent knowledge graph grows with you!',
		highlight: null,
		action: 'cleanup'
	}
];



let embeddingModel = null; // transformers.js embedding model (MiniLM)
let summarizationModel = null; // will point to the Web-LLM engine (chat-style)
let db = null;

const SIMILARITY_THRESHOLD = 0.65;
const LOOSE_SIMILARITY_THRESHOLD = 0.45;

const queueProgress = computed(() => {
	if (processingQueue.value.length === 0) return 0;
	return (processedCount.value / processingQueue.value.length) * 100;
});


const GOOGLE_SEARCH_WORKER_URL = 'https://rocus.othman90hijawi.workers.dev';


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

const iconOptions = [
	"RocusFileIcon.png",
	"RocusFileIconColored.png",
	"RocusFileIconDark.png",
];

const iconUrls = iconOptions.map(
	(icon) => new URL(`./images/${icon}`, import.meta.url).href
);

function getIconUrl(iconFileName) {
	if (!iconFileName) return '';
	if (iconFileName.startsWith('http') || iconFileName.startsWith('data:')) {
		return iconFileName;
	}
	return new URL(`./images/${iconFileName}`, import.meta.url).href;
}
// Tutorial functions
function startTutorial() {
	tutorialActive.value = true;
	tutorialStep.value = 0;
	updateTutorialHighlight();
}

function nextTutorialStep() {
	if (tutorialStep.value < tutorialSteps.length - 1) {
		tutorialStep.value++;
		updateTutorialHighlight();
		performTutorialAction();
	} else {
		finishTutorial();
	}
}

function previousTutorialStep() {
	if (tutorialStep.value > 0) {
		tutorialStep.value--;
		updateTutorialHighlight();
		performTutorialAction();
	}
}

function skipTutorial() {
	// Cleanup demo cluster
	if (tutorialDemoCluster.value) {
		collapseNode();
		tutorialDemoCluster.value = null;
	}
	finishTutorial();
}

function finishTutorial() {
	// Cleanup demo cluster
	if (tutorialDemoCluster.value) {
		collapseNode();
		tutorialDemoCluster.value = null;
	}

	tutorialActive.value = false;
	tutorialStep.value = 0;
	tutorialHighlightRect.value = { top: 0, left: 0, width: 0, height: 0 };
	localStorage.setItem('rocus-tutorial-completed', 'true');
}

function updateTutorialHighlight() {
	const step = tutorialSteps[tutorialStep.value];

	if (!step.highlight) {
		tutorialHighlightRect.value = { top: 0, left: 0, width: 0, height: 0 };
		return;
	}

	// Small delay to ensure DOM is ready
	setTimeout(() => {
		let element;

		switch (step.highlight) {
			case 'model-status':
				// Find the model status button (3rd button in header with computer icon)
				const buttons = document.querySelectorAll('.flex.items-center.gap-3 button');
				element = buttons[2]; // Model status is 3rd button
				break;

			case 'albums-dropdown':
				element = document.querySelector('.flex-1.max-w-2xl .relative button');
				break;

			case 'demo-cluster':
				// Highlight a visible cluster node
				if (tutorialDemoCluster.value) {
					// Find the actual SVG circle element for the demo cluster
					const node = container.select('.nodes')
						.selectAll('.node')
						.filter(d => d.id === tutorialDemoCluster.value.id)
						.node();
					element = node;
				}
				break;

			case 'theme-button':
				// Theme button is 1st button in header
				const headerButtons = document.querySelectorAll('.flex.items-center.gap-3 button');
				element = headerButtons[0];
				break;

			case 'search-bar':
				element = document.querySelector('.fixed.top-24');
				break;
		}

		if (element) {
			const rect = element.getBoundingClientRect();
			tutorialHighlightRect.value = {
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height
			};
		}
	}, 100);
}

function performTutorialAction() {
	const step = tutorialSteps[tutorialStep.value];

	if (step.action === 'showDemoCluster') {
		// Find a good cluster to demo
		if (graphData.nodes.length > 0) {
			const clusterNodes = graphData.nodes.filter(n => n.type === 'cluster');
			if (clusterNodes.length > 0) {
				tutorialDemoCluster.value = clusterNodes[0];
				updateTutorialHighlight();
			}
		}
	} else if (step.action === 'explodeDemoCluster') {
		// Explode the demo cluster
		if (tutorialDemoCluster.value && tutorialDemoCluster.value.websites.length > 0) {
			explodeNode(tutorialDemoCluster.value);
		}
	} else if (step.action === 'cleanup') {
		// Collapse any exploded node
		if (tutorialDemoCluster.value) {
			collapseNode();
			tutorialDemoCluster.value = null;
		}
	}
}

const showNewDataNotification = ref(false);

function toggleThemes() {
	showThemes.value = !showThemes.value;
}

function closeThemes() {
	showThemes.value = false;
}

function previewTheme(theme) {
	// Temporarily apply theme on hover
	applyThemeColors(theme);
}

function applyTheme(theme) {
	currentTheme.value = theme;
	isDarkMode.value = theme.isDark;
	localStorage.setItem('theme', theme.id);
	localStorage.setItem('darkMode', theme.isDark.toString());
	applyThemeColors(theme);
	closeThemes();
}

function applyThemeColors(theme) {
	if (!theme || !theme.colors) return;

	// Update CSS variables
	const root = document.documentElement;
	Object.entries(theme.colors).forEach(([key, value]) => {
		root.style.setProperty(`--color-${key}`, value);
	});

	// Update D3 nodes if graph exists
	if (container) {
		container
			.select(".nodes")
			.selectAll(".node")
			.transition()
			.duration(300)
			.attr("fill", (d) => {
				if (d.type === "discover") return theme.colors.primary;
				if (d.type === "website") return theme.colors.node;
				return theme.colors.node;
			})
			.attr("stroke", (d) => {
				if (d.type === "discover") return theme.colors.secondary;
				if (d.type === "website") return theme.colors.nodeStroke;
				return theme.colors.nodeStroke;
			});

		container
			.select(".labels")
			.selectAll(".node-label")
			.transition()
			.duration(300)
			.style("fill", (d) => {
				if (d.type === "discover") return "#ffffff";
				return theme.colors.text;
			});

		// Update links too
		container
			.select(".links")
			.selectAll(".link")
			.transition()
			.duration(300)
			.style("stroke", (d) => {
				if (d.type === 'discover-link') return theme.colors.nodeStroke;
				if (d.type === 'website-link') return theme.colors.nodeStroke;
				return theme.colors.nodeStroke;
			});
	}
}

function loadThemePreference() {
	const savedThemeId = localStorage.getItem('theme');
	if (savedThemeId) {
		const theme = themes.find(t => t.id === savedThemeId);
		if (theme) {
			currentTheme.value = theme;
			isDarkMode.value = theme.isDark;
			applyThemeColors(theme);
			return;
		}
	}

	// Default theme
	currentTheme.value = themes[0];
	applyThemeColors(themes[0]);
}

async function exportAllData() {
	try {
		// Gather all data
		const exportData = {
			version: '1.0.0',
			exportDate: new Date().toISOString(),
			albums: Object.values(albums.value),
			clusters: Object.values(clusters.value),
			websites: Object.values(websites.value),
			embeddings: embeddings.value,
			theme: {
				id: currentTheme.value.id,
				isDark: currentTheme.value.isDark
			}
		};

		// Convert to JSON
		const jsonString = JSON.stringify(exportData, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });

		// Create download link
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `rocus-backup-${new Date().toISOString().split('T')[0]}.rocus`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		console.log('✅ Data exported successfully');
	} catch (error) {
		console.error('❌ Error exporting data:', error);
		alert('Failed to export data');
	}
}

// Trigger file input
function triggerImport() {
	importFileInput.value?.click();
}

// Import function
async function handleImport(event) {
	const file = event.target.files?.[0];
	if (!file) return;

	const confirmed = confirm(
		'⚠️ Importing will replace ALL current data. Are you sure?\n\nMake sure you have a backup first!'
	);

	if (!confirmed) {
		event.target.value = ''; // Reset input
		return;
	}

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		// Validate import data
		if (!importData.version || !importData.albums || !importData.clusters || !importData.websites) {
			throw new Error('Invalid Rocus file format');
		}

		isLoading.value = true;

		// Clear existing data
		albums.value = {};
		clusters.value = {};
		websites.value = {};
		embeddings.value = {};

		// Import albums
		for (const album of importData.albums) {
			albums.value[album.id] = album;
		}

		// Import clusters
		for (const cluster of importData.clusters) {
			clusters.value[cluster.id] = cluster;
		}

		// Import websites
		for (const website of importData.websites) {
			websites.value[website.id] = website;
		}

		// Import embeddings
		embeddings.value = importData.embeddings || {};

		// Apply theme if included
		if (importData.theme) {
			const theme = themes.find(t => t.id === importData.theme.id);
			if (theme) {
				applyTheme(theme);
			}
		}

		// Save to IndexedDB
		await saveToIndexedDB();
		await loadData();

		if (simulation) {
			simulation.nodes(graphData.nodes);
			simulation.force('link').links(graphData.links);
			simulation.alpha(1).restart();
			renderGraph();
		}

		isLoading.value = false;
		event.target.value = ''; // Reset input

		alert('✅ Data imported successfully!');
		console.log('✅ Import complete');

	} catch (error) {
		isLoading.value = false;
		console.error('❌ Error importing data:', error);
		alert('Failed to import data: ' + error.message);
		event.target.value = ''; // Reset input
	}
}

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

		// Ensure cluster_ids is a plain array, not a proxy
		const updatedAlbum = {
			...existingAlbum,
			name: albumData.name,
			icon: albumData.icon,
			cluster_ids: Array.from(albumData.cluster_ids || existingAlbum.cluster_ids || []), // FIX: Convert to plain array
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
						return true; //returns all the clusters if no album is specified
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
		let clusterIds;
		if (activeAlbumId === null) {
			// "All Clusters" view - show ALL connections
			clusterIds = Object.keys(clusters.value);
		} else {
			// Specific album - only show connections within that album
			clusterIds = Object.keys(clusters.value).filter(id => {
				const cluster = clusters.value[id];
				return cluster.album_id === activeAlbumId;
			});
		}

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


// similar links 

async function googleSearch(query, numResults = 10) {
	if (!query || !query.trim()) {
		console.warn("⚠️ Empty search query");
		return [];
	}

	try {
		console.log(`🔍 Searching Google via Cloudflare Worker for: '${query}'`);

		// Call Cloudflare Worker instead of Google directly
		const url = new URL(GOOGLE_SEARCH_WORKER_URL);
		url.searchParams.set('q', query);
		url.searchParams.set('num', numResults.toString());

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success || !data.results) {
			throw new Error('Invalid response from search worker');
		}

		console.log(`✅ Found ${data.results.length} search results`);
		return data.results;

	} catch (error) {
		console.error(`⚠️ Google search error for query '${query}':`, error);
		return [];
	}
}

async function addSimilarLinksToCluster(clusterId) {
	const cluster = clusters.value[clusterId];
	if (!cluster) return;

	// Initialize similar_links if not present
	if (!cluster.similar_links) {
		cluster.similar_links = {};
	}

	const websiteIds = cluster.websites || [];

	// Get existing URLs in cluster to avoid duplicates
	const existingUrls = new Set();
	for (const wid of websiteIds) {
		const website = websites.value[wid];
		if (website && website.url) {
			existingUrls.add(website.url);
		}
	}

	// Search for each website's query
	for (const wid of websiteIds) {
		const website = websites.value[wid];
		if (!website) continue;

		const searchQuery = website.search_query || website.topic || website.title;

		// Skip if we already have results for this website
		if (!searchQuery || cluster.similar_links[wid]) continue;

		console.log(`🔍 Searching similar links for website: ${website.title}`);

		// Search Google
		const searchResults = await googleSearch(searchQuery, 10);

		// Filter out URLs already in cluster
		const newLinks = searchResults.filter(result =>
			result.url && !existingUrls.has(result.url)
		);

		if (newLinks.length > 0) {
			cluster.similar_links[wid] = newLinks;
			console.log(`🔗 Found ${newLinks.length} similar links for website ${wid}`);
		}
	}

	// Save to IndexedDB
	await saveToIndexedDB();
}

async function searchSimilarWebsites(query) {
	try {
		console.log("📡 Searching for similar websites:", query);

		if (!explodedNode.value) return [];

		const clusterId = explodedNode.value.id;
		const cluster = clusters.value[clusterId];

		// Ensure similar links are populated for this cluster
		await addSimilarLinksToCluster(clusterId);

		// Collect all similar links from the cluster
		const allSimilarLinks = [];
		const seenUrls = new Set();

		if (cluster.similar_links) {
			for (const [websiteId, links] of Object.entries(cluster.similar_links)) {
				for (const link of links) {
					if (!seenUrls.has(link.url)) {
						seenUrls.add(link.url);
						allSimilarLinks.push(link);
					}
				}
			}
		}

		// If we don't have enough results, do a fresh Google search
		if (allSimilarLinks.length < 5) {
			console.log("🔍 Not enough cached results, performing fresh search");
			const freshResults = await googleSearch(query, 10);

			// Get existing cluster URLs
			const clusterUrls = new Set(
				cluster.websites.map(wid => websites.value[wid]?.url).filter(Boolean)
			);

			for (const result of freshResults) {
				if (!seenUrls.has(result.url) && !clusterUrls.has(result.url)) {
					seenUrls.add(result.url);
					allSimilarLinks.push(result);
				}
			}
		}

		// Sort by relevance (you could implement scoring here)
		// For now, just limit to top 10
		return allSimilarLinks.slice(0, 10);

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
	console.log("Processing Cluster data:", { clustersData, similarities });

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
	if (explodedNode.value && explodedNode.value.id !== clusterNode.id) {
		collapseNode();
		setTimeout(() => {
			performExplosion(clusterNode);
		}, 100);
	} else if (explodedNode.value && explodedNode.value.id === clusterNode.id) {
		collapseNode();
	} else {
		performExplosion(clusterNode);
	}
}

function performExplosion(clusterNode) {
	explodedNode.value = clusterNode;
	const centerX = clusterNode.x;
	const centerY = clusterNode.y;

	// Lock cluster position ONLY
	clusterNode.fx = centerX;
	clusterNode.fy = centerY;

	const radius = 80;
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
			x: centerX, // Start at center
			y: centerY,
			vx: 0, // ADD: reset velocity
			vy: 0, // ADD: reset velocity
			fx: centerX + Math.cos(angle) * radius,
			fy: centerY + Math.sin(angle) * radius,
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
		vx: 0, // ADD: reset velocity
		vy: 0, // ADD: reset velocity
		fx: centerX + Math.cos(discoverAngle) * radius,
		fy: centerY + Math.sin(discoverAngle) * radius,
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
	simulation.alpha(0.3).restart();

	renderGraph();

	// Release positions after animation
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
	}, 500);
}


function collapseNode() {
	if (!explodedNode.value) return;

	const centerX = explodedNode.value.x;
	const centerY = explodedNode.value.y;

	// Immediately remove nodes and links (no animation needed for switch)
	graphData.nodes = graphData.nodes.filter(
		(node) => node.type !== "website" && node.type !== "discover"
	);

	graphData.links = graphData.links.filter(
		(link) => link.type !== "website-link" && link.type !== "discover-link"
	);

	// Release the exploded cluster's fixed position
	if (explodedNode.value) {
		explodedNode.value.fx = null;
		explodedNode.value.fy = null;
	}

	websiteNodes = [];
	explodedNode.value = null;
	selectedWebsite.value = null;

	// Update simulation
	simulation.nodes(graphData.nodes);
	simulation.force("link").links(graphData.links);

	renderGraph();
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
		.attr("height", height)
		.style("overflow", "visible");

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
		.force("center", d3.forceCenter(width / 2, height / 2))
		.force(
			"collision",
			d3.forceCollide().radius((d) => d.size * settings.nodeSize + 15)
		)
		.force("x", d3.forceX(width / 2).strength(0.02))
		.force("y", d3.forceY(height / 2).strength(0.02));

	renderGraph();

	setTimeout(() => {
		centerView();
	}, 1000);
}

function centerView() {
	if (!svg || !container || !graphContainer.value) return;

	const width = graphContainer.value.clientWidth;
	const height = graphContainer.value.clientHeight;
	const bounds = container.node().getBBox();

	if (bounds.width > 0 && bounds.height > 0) {
		const fullWidth = bounds.width;
		const fullHeight = bounds.height;
		const midX = bounds.x + fullWidth / 2;
		const midY = bounds.y + fullHeight / 2;

		const scale = Math.min(width / fullWidth, height / fullHeight) * 0.7;
		const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

		svg
			.transition()
			.duration(1500)
			.call(
				zoom.transform,
				d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
			);
	}
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
			if (d.type === "discover") return currentTheme.value.colors.primary;
			if (d.type === "website") return currentTheme.value.colors.node;
			return currentTheme.value.colors.node;
		})
		.attr("stroke", (d) => {
			if (d.type === "discover") return currentTheme.value.colors.secondary;
			if (d.type === "website") return currentTheme.value.colors.nodeStroke;
			return currentTheme.value.colors.nodeStroke;
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
			return currentTheme.value.colors.text;
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
			.attr('x', d => d.x)
			.attr('y', d => {
				// All node types should have text below
				return d.y + (d.size * settings.nodeSize) + 18;
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
	console.log("Showing details for website:", websiteNode);

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

async function confirmRemoveWebsites(deleteEntirely = false) {
	if (!contextCluster.value || selectedWebsitesToRemove.value.length === 0) return;

	const action = deleteEntirely ? 'delete' : 'remove';
	const confirmed = confirm(
		`Are you sure you want to ${action} ${selectedWebsitesToRemove.value.length} website(s)? ${deleteEntirely ? 'This will permanently delete them.' : 'They will be removed from this cluster only.'
		}`
	);

	if (!confirmed) return;

	try {
		const clusterId = contextCluster.value.id;

		for (const websiteId of selectedWebsitesToRemove.value) {
			const index = clusters.value[clusterId].websites.indexOf(websiteId);
			if (index > -1) {
				clusters.value[clusterId].websites.splice(index, 1);
			}

			if (deleteEntirely) {
				// Delete website entirely from all clusters and embeddings
				delete websites.value[websiteId];
				delete embeddings.value[websiteId];

				// Remove from other clusters too
				for (const cluster of Object.values(clusters.value)) {
					const idx = cluster.websites.indexOf(websiteId);
					if (idx > -1) {
						cluster.websites.splice(idx, 1);
					}
				}
			} else {
				// Just remove cluster reference
				if (websites.value[websiteId]) {
					delete websites.value[websiteId].cluster_id;
				}
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
		.attr("stroke", d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? currentTheme.value.colors.primary : null
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
		.attr("stroke", d => {
			if (d.type === 'discover') return currentTheme.value.colors.secondary;
			if (d.type === 'website') return currentTheme.value.colors.nodeStroke;
			return currentTheme.value.colors.nodeStroke;
		})
		.attr('stroke-width', 2);

	container.select('.links')
		.selectAll('.link')
		.style('opacity', d => {
			if (d.type === 'website-link' || d.type === 'discover-link') return 0.6;
			return showConnections.value ? 0.4 : 0;
		})
		.style("stroke", d => {
			if (d.type === 'discover-link') return currentTheme.value.colors.nodeStroke;
			if (d.type === 'website-link') return currentTheme.value.colors.nodeStroke;
			return currentTheme.value.colors.nodeStroke;
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

function loadDarkModePreference() {
	const saved = localStorage.getItem('darkMode');
	if (saved !== null) {
		isDarkMode.value = saved === 'true';
		updateTheme();
	}
}

function toggleDarkMode() {
	// Find the opposite theme (light <-> dark)
	const newTheme = currentTheme.value.isDark
		? themes.find(t => t.id === 'default-light')
		: themes.find(t => t.id === 'default-dark');

	if (newTheme) {
		applyTheme(newTheme);
	}
}

function updateTheme() {
	if (!currentTheme.value || !container) return;

	applyThemeColors(currentTheme.value);
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
	centerView();
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
					content: `Generate the main topic of this page using ONLY one or two words

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

function assignToCluster(websiteId, topic, embedding, searchQuery, albumId = null) {
	const normalizedTopic = normalizeTopicTerm(topic);

	const similarWebsites = findSimilarWebsites(embedding, websiteId, albumId);

	for (const { websiteId: similarId, similarity } of similarWebsites) {
		for (const [clusterId, cluster] of Object.entries(clusters.value)) {
			if (cluster.album_id !== albumId) continue;

			if (cluster.websites.includes(similarId)) {
				const clusterTopic = cluster.topic;

				if (similarity >= SIMILARITY_THRESHOLD) {
					if (!cluster.websites.includes(websiteId)) {
						cluster.websites.push(websiteId);
					}
					console.log(`🔗 Added to cluster ${clusterId} in album ${albumId || 'All Clusters'}`);

					return clusterId;
				}

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

		addSimilarLinksToCluster(clusterId).catch(err =>
			console.error("Error adding similar links:", err)
		);

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

		console.log("🚀 Component mounted, initializing...");

		await initDB();
		loadThemePreference();
		console.log("✅ IndexedDB ready");

		await loadFromIndexedDB();

		initializeGraph();
		window.addEventListener("resize", handleResize);

		messageListener = setupMessageListener();
		console.log("✅ Message listener ready");

		const tutorialCompleted = localStorage.getItem('rocus-tutorial-completed');
		if (!tutorialCompleted) {
			setTimeout(() => {
				if (graphData.nodes.length > 0) {
					startTutorial();
				}
			}, 3000);
		}

		loadModels().catch(err => {
			console.error("Model loading failed (non-fatal):", err);
		});
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

watch(tutorialActive, (isActive) => {
	if (isActive) {
		const handleResize = () => updateTutorialHighlight();
		window.addEventListener('resize', handleResize);

		const unwatchActive = watch(tutorialActive, (newValue) => {
			if (!newValue) {
				window.removeEventListener('resize', handleResize);
				unwatchActive();
			}
		});
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