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

					<!-- <button @click="handleProfileClick" class="p-2.5 rounded-xl transition-all"
						:style="{ backgroundColor: currentTheme.colors.surface }">
						<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</button> -->
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

		<div v-if="showModelStatus" @click="closeModelStatus"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
						AI Model Status
					</h3>
					<button @click="closeModelStatus" class="p-2 rounded-xl transition-all">
						<svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
							stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Model Status -->
				<div class="space-y-4">
					<!-- Embedding Model -->
					<div class="p-4 rounded-xl" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `1px solid ${currentTheme.colors.border}`
					}">
						<div class="flex items-center justify-between mb-2">
							<span class="font-semibold" :style="{ color: currentTheme.colors.text }">
								Embedding Model
							</span>
							<span v-if="embeddingModel" class="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
								Loaded
							</span>
							<span v-else class="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">
								Not Loaded
							</span>
						</div>
						<p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
							Xenova/all-MiniLM-L6-v2
						</p>
					</div>

					<!-- Summarization Model -->
					<div class="p-4 rounded-xl" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `1px solid ${currentTheme.colors.border}`
					}">
						<div class="flex items-center justify-between mb-2">
							<span class="font-semibold" :style="{ color: currentTheme.colors.text }">
								AI Model
							</span>
							<span v-if="summarizationModel"
								class="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
								Loaded
							</span>
							<span v-else class="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">
								Not Loaded
							</span>
						</div>
						<p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
							Qwen2.5-0.5B (Self-hosted)
						</p>
					</div>

					<!-- Processing Queue -->
					<div class="p-4 rounded-xl" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `1px solid ${currentTheme.colors.border}`
					}">
						<div class="flex items-center justify-between mb-2">
							<span class="font-semibold" :style="{ color: currentTheme.colors.text }">
								Processing Queue
							</span>
							<span class="px-2 py-1 rounded-full text-xs" :style="{
								backgroundColor: processingQueue.length > 0 ? currentTheme.colors.primary + '20' : currentTheme.colors.background,
								color: processingQueue.length > 0 ? currentTheme.colors.primary : currentTheme.colors.textSecondary
							}">
								{{ processingQueue.length }} items
							</span>
						</div>
						<p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
							Websites waiting to be processed
						</p>
					</div>

					<div v-if="modelLoading" class="p-4 rounded-xl" :style="{
						backgroundColor: currentTheme.colors.primary + '10',
						border: `1px solid ${currentTheme.colors.primary}40`
					}">
						<p class="text-sm mb-2" :style="{ color: currentTheme.colors.text }">
							{{ loadingMessage }}
						</p>
						<div class="w-full h-2 rounded-full overflow-hidden"
							:style="{ backgroundColor: currentTheme.colors.border }">
							<div class="h-full transition-all duration-300 rounded-full" :style="{
								width: downloadProgress + '%',
								backgroundColor: currentTheme.colors.primary
							}"></div>
						</div>
					</div>

					<!-- Error State -->
					<div v-if="error && !modelLoading" class="p-4 rounded-xl bg-red-500/10 border border-red-500/40">
						<p class="text-sm font-semibold text-red-500 mb-2">
							⚠️ Error Loading Models
						</p>
						<p class="text-xs text-red-400">
							{{ error }}
						</p>
					</div>
				</div>

				<!-- Actions -->
				<div class="mt-6 space-y-3">
					<button v-if="error" @click="loadModels"
						class="w-full px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.primary,
							color: '#ffffff'
						}">
						🔄 Retry Loading Models
					</button>

					<button @click="closeModelStatus" class="w-full px-6 py-3 rounded-xl font-medium transition-all"
						:style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Close
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
								Help Improve Rocus
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
								Anonymous usage analytics
							</div>
						</div>
						<button @click="toggleAnalytics" class="relative w-14 h-8 rounded-full transition-all"
							:class="analyticsConsent ? 'bg-[#4A90E2]' : 'bg-gray-300'">
							<div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
								:class="{ 'translate-x-6': analyticsConsent }"></div>
						</button>
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

					<div class="h-px" :style="{ backgroundColor: currentTheme.colors.border }"></div>

					<!-- AI Cache Management -->
					<div class="space-y-4 pt-4">
						<div class="font-medium" :style="{ color: currentTheme.colors.text }">
							AI Models & Cache
						</div>

						<button @click="clearModelCache"
							class="w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
							:style="{
								backgroundColor: currentTheme.colors.background,
								color: currentTheme.colors.error || '#ef4444',
								border: `1px solid ${currentTheme.colors.error || '#ef4444'}`
							}">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Clear AI Model Cache
						</button>

						<p class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
							If models fail to load or Chrome crashes, clear the cache and reload. This will re-download
							models (~350MB).
						</p>
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

			<button @click="showAddConnectionModal" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
				</svg>
				<span class="text-sm font-medium">Add Connection</span>
			</button>

			<button @click="showRemoveConnectionModal"
				class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					<line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" />
				</svg>
				<span class="text-sm font-medium">Remove Connection</span>
			</button>

			<button @click="showAddToAlbumModalFunction" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
				</svg>
				<span class="text-sm font-medium">Add to Album</span>
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

		<div v-if="showAddConnection" @click="closeAddConnectionModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn border max-h-[80vh] overflow-y-auto"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Add Connection from "{{ contextCluster?.topic }}"
				</h3>

				<div class="mb-4">
					<input v-model="connectionSearchTerm" type="text" placeholder="Search clusters..."
						class="w-full px-4 py-3 border rounded-xl outline-none transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							borderColor: currentTheme.colors.border,
							color: currentTheme.colors.text
						}" />
				</div>

				<div class="space-y-2 mb-6">
					<div v-for="cluster in availableClustersForConnection" :key="cluster.id"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
						:class="selectedConnectionCluster === cluster.id ? 'ring-2' : ''" :style="{
							borderColor: selectedConnectionCluster === cluster.id ? currentTheme.colors.primary : currentTheme.colors.border,
							backgroundColor: selectedConnectionCluster === cluster.id ? `${currentTheme.colors.primary}10` : 'transparent'
						}" @click="selectedConnectionCluster = cluster.id">
						<input type="radio" :checked="selectedConnectionCluster === cluster.id" class="w-4 h-4" />
						<div class="flex-1">
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								{{ cluster.topic }}
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
								{{ cluster.website_count }} websites
							</div>
						</div>
					</div>
				</div>

				<div class="flex gap-3">
					<button @click="closeAddConnectionModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
					<button @click="confirmAddConnection"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all"
						:disabled="!selectedConnectionCluster">
						Add Connection
					</button>
				</div>
			</div>
		</div>

		<div v-if="showRemoveConnection" @click="closeRemoveConnectionModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn border max-h-[80vh] overflow-y-auto"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Remove Connection from "{{ contextCluster?.topic }}"
				</h3>

				<div v-if="connectedClusters.length > 0" class="space-y-2 mb-6">
					<div v-for="cluster in connectedClusters" :key="cluster.id"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
						:class="selectedConnectionToRemove === cluster.id ? 'ring-2 ring-red-500' : ''" :style="{
							borderColor: selectedConnectionToRemove === cluster.id ? '#ef4444' : currentTheme.colors.border,
							backgroundColor: selectedConnectionToRemove === cluster.id ? '#fee2e210' : 'transparent'
						}" @click="selectedConnectionToRemove = cluster.id">
						<input type="radio" :checked="selectedConnectionToRemove === cluster.id" class="w-4 h-4" />
						<div class="flex-1">
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								{{ cluster.topic }}
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
								Similarity: {{ (cluster.similarity * 100).toFixed(1) }}%
							</div>
						</div>
					</div>
				</div>

				<div v-else class="text-center py-8" :style="{ color: currentTheme.colors.textSecondary }">
					No connections to remove
				</div>

				<div class="flex gap-3">
					<button @click="closeRemoveConnectionModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
					<button @click="confirmRemoveConnection"
						class="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
						:disabled="!selectedConnectionToRemove || connectedClusters.length === 0">
						Remove Connection
					</button>
				</div>
			</div>
		</div>

		<div v-if="showAddToAlbumModal" @click="closeAddToAlbumModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop
				class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn border max-h-[80vh] overflow-y-auto"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					borderColor: currentTheme.colors.border
				}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Add "{{ contextCluster?.topic }}" to Album
				</h3>

				<div v-if="Object.values(albums).length > 0" class="space-y-2 mb-6">
					<div v-for="album in Object.values(albums)" :key="album.id"
						class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
						:class="selectedAlbumForCluster === album.id ? 'ring-2' : ''" :style="{
							borderColor: selectedAlbumForCluster === album.id ? currentTheme.colors.primary : currentTheme.colors.border,
							backgroundColor: selectedAlbumForCluster === album.id ? `${currentTheme.colors.primary}10` : 'transparent'
						}" @click="selectedAlbumForCluster = album.id">
						<input type="radio" :checked="selectedAlbumForCluster === album.id" class="w-4 h-4" />
						<img :src="getIconUrl(album.icon)" alt="Album icon" class="w-8 h-8 object-contain" />
						<div class="flex-1">
							<div class="font-medium" :style="{ color: currentTheme.colors.text }">
								{{ album.name }}
							</div>
						</div>
					</div>
				</div>

				<div v-else class="text-center py-8" :style="{ color: currentTheme.colors.textSecondary }">
					No albums available. Create one first!
				</div>

				<div class="flex gap-3">
					<button @click="closeAddToAlbumModal" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
					<button @click="confirmAddToAlbum"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all"
						:disabled="!selectedAlbumForCluster || Object.values(albums).length === 0">
						Add to Album
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
			v1.0.1
		</button>

		<!-- <button @click="startTutorial"
			class="fixed bottom-8 right-50 z-[1000] p-2.5 rounded-xl opacity-30 transition-all" :style="{
				backgroundColor: currentTheme.colors.surface,
				border: `1px solid ${currentTheme.colors.border}`
			}">
			<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
				viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button> -->

		<button @click="startTutorial"
			class="fixed bottom-8 left-48 z-[1000] p-2.5 rounded-xl transition-all group relative" :style="{
				backgroundColor: currentTheme.colors.surface,
				border: `1px solid ${currentTheme.colors.border}`
			}">
			<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
				viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<!-- Tooltip -->
			<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
				:style="{
					backgroundColor: currentTheme.colors.surface,
					color: currentTheme.colors.text,
					border: `1px solid ${currentTheme.colors.border}`
				}">
				Tutorial
			</div>
		</button>

		<div v-if="showCompatibilityCheck"
			class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-fadeIn">
			<div class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn" :style="{
				backgroundColor: currentTheme.colors.surface,
				border: `2px solid ${compatibilityResults.overall === 'success' ? '#10b981' :
					compatibilityResults.overall === 'error' ? '#ef4444' : currentTheme.colors.border}`
			}">
				<!-- Header -->
				<div class="flex items-start justify-between mb-6">
					<div>
						<h3 class="text-2xl font-bold mb-2" :style="{ color: currentTheme.colors.text }">
							System Compatibility Check
						</h3>
						<p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
							Verifying your browser can run Rocus AI models...
						</p>
					</div>
					<div v-if="compatibilityResults.overall !== 'checking'"
						class="w-12 h-12 rounded-full flex items-center justify-center" :style="{
							backgroundColor: compatibilityResults.overall === 'success' ? '#10b98120' : '#ef444420'
						}">
						<svg v-if="compatibilityResults.overall === 'success'" class="w-7 h-7 text-green-500"
							fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd" />
						</svg>
						<svg v-else class="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd" />
						</svg>
					</div>
				</div>

				<!-- Checks List -->
				<div class="space-y-3 mb-6">
					<!-- WebGPU Check -->
					<div class="p-4 rounded-xl transition-all" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `2px solid ${compatibilityResults.webgpu.status === 'success' ? '#10b981' :
							compatibilityResults.webgpu.status === 'error' ? '#ef4444' :
								compatibilityResults.webgpu.status === 'warning' ? '#f59e0b' :
									currentTheme.colors.border
							}`
					}">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 mt-0.5">
								<div v-if="compatibilityResults.webgpu.status === 'checking'"
									class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
									:style="{ borderColor: currentTheme.colors.primary }"></div>
								<svg v-else-if="compatibilityResults.webgpu.status === 'success'"
									class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd" />
								</svg>
								<svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-semibold mb-1" :style="{ color: currentTheme.colors.text }">
									WebGPU Support (Critical)
								</div>
								<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
									{{ compatibilityResults.webgpu.message }}
								</div>
								<div v-if="compatibilityResults.webgpu.fix" class="text-xs mt-2 px-3 py-2 rounded-lg"
									:style="{
										backgroundColor: currentTheme.colors.surface,
										color: currentTheme.colors.primary
									}">
									💡 Fix: {{ compatibilityResults.webgpu.fix }}
								</div>
							</div>
						</div>
					</div>

					<!-- Memory Check -->
					<div class="p-4 rounded-xl transition-all" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `2px solid ${compatibilityResults.memory.status === 'success' ? '#10b981' :
							compatibilityResults.memory.status === 'warning' ? '#f59e0b' :
								currentTheme.colors.border
							}`
					}">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 mt-0.5">
								<div v-if="compatibilityResults.memory.status === 'checking'"
									class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
									:style="{ borderColor: currentTheme.colors.primary }"></div>
								<svg v-else-if="compatibilityResults.memory.status === 'success'"
									class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd" />
								</svg>
								<svg v-else class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-semibold mb-1" :style="{ color: currentTheme.colors.text }">
									Available Memory
								</div>
								<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
									{{ compatibilityResults.memory.message }}
								</div>
								<div v-if="compatibilityResults.memory.fix" class="text-xs mt-2 px-3 py-2 rounded-lg"
									:style="{
										backgroundColor: currentTheme.colors.surface,
										color: currentTheme.colors.primary
									}">
									💡 Fix: {{ compatibilityResults.memory.fix }}
								</div>
							</div>
						</div>
					</div>

					<!-- IndexedDB Check -->
					<div class="p-4 rounded-xl transition-all" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `2px solid ${compatibilityResults.indexeddb.status === 'success' ? '#10b981' :
							compatibilityResults.indexeddb.status === 'error' ? '#ef4444' :
								currentTheme.colors.border
							}`
					}">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 mt-0.5">
								<div v-if="compatibilityResults.indexeddb.status === 'checking'"
									class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
									:style="{ borderColor: currentTheme.colors.primary }"></div>
								<svg v-else-if="compatibilityResults.indexeddb.status === 'success'"
									class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd" />
								</svg>
								<svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-semibold mb-1" :style="{ color: currentTheme.colors.text }">
									Local Storage (IndexedDB)
								</div>
								<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
									{{ compatibilityResults.indexeddb.message }}
								</div>
								<div v-if="compatibilityResults.indexeddb.fix" class="text-xs mt-2 px-3 py-2 rounded-lg"
									:style="{
										backgroundColor: currentTheme.colors.surface,
										color: currentTheme.colors.primary
									}">
									💡 Fix: {{ compatibilityResults.indexeddb.fix }}
								</div>
							</div>
						</div>
					</div>

					<!-- Cache API Check -->
					<div class="p-4 rounded-xl transition-all" :style="{
						backgroundColor: currentTheme.colors.background,
						border: `2px solid ${compatibilityResults.cache.status === 'success' ? '#10b981' :
							compatibilityResults.cache.status === 'error' ? '#ef4444' :
								compatibilityResults.cache.status === 'warning' ? '#f59e0b' :
									currentTheme.colors.border
							}`
					}">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 mt-0.5">
								<div v-if="compatibilityResults.cache.status === 'checking'"
									class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
									:style="{ borderColor: currentTheme.colors.primary }"></div>
								<svg v-else-if="compatibilityResults.cache.status === 'success'"
									class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd" />
								</svg>
								<svg v-else-if="compatibilityResults.cache.status === 'warning'"
									class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd" />
								</svg>
								<svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-semibold mb-1" :style="{ color: currentTheme.colors.text }">
									Cache API (Model Storage)
								</div>
								<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
									{{ compatibilityResults.cache.message }}
								</div>
								<div v-if="compatibilityResults.cache.fix" class="text-xs mt-2 px-3 py-2 rounded-lg"
									:style="{
										backgroundColor: currentTheme.colors.surface,
										color: currentTheme.colors.primary
									}">
									💡 Fix: {{ compatibilityResults.cache.fix }}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-3">
					<button v-if="compatibilityResults.overall === 'success'" @click="() => {
						showCompatibilityCheck = false;
						localStorage.setItem('rocus-compatibility-checked', 'true');
					}" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all bg-green-500 hover:bg-green-600 text-white">
						✓ Continue to Rocus
					</button>
					<button v-else-if="compatibilityResults.overall === 'error'" @click="() => {
						showCompatibilityCheck = false;
						localStorage.setItem('rocus-compatibility-checked', 'true');
					}" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
						backgroundColor: currentTheme.colors.background,
						color: currentTheme.colors.text
					}">
						Continue Anyway (May Not Work)
					</button>
					<button @click="checkSystemCompatibility" class="px-6 py-3 rounded-xl font-medium transition-all"
						:style="{
							backgroundColor: currentTheme.colors.primary,
							color: '#fff'
						}">
						🔄 Re-check
					</button>
				</div>

				<!-- Help Text -->
				<div v-if="compatibilityResults.overall === 'error'" class="mt-4 p-4 rounded-xl" :style="{
					backgroundColor: currentTheme.colors.background,
					border: `1px solid ${currentTheme.colors.border}`
				}">
					<div class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
						⚠️ Rocus may not work properly
					</div>
					<div class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
						Critical checks failed. Rocus requires WebGPU for AI processing. Try:
						<ul class="list-disc list-inside mt-2 space-y-1">
							<li>Using Chrome/Edge 113+ or Firefox Nightly</li>
							<li>Opening in Incognito/Private mode</li>
							<li>Enabling chrome://flags/#enable-unsafe-webgpu</li>
							<li>Updating your GPU drivers</li>
							<li>Checking browser console for specific errors</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

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
							Current version: v1.0.1 (Beta)
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

	<div v-if="showBanner" class="fixed bottom-0 left-0 right-0 z-[9999] animate-slideInUp">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div class="rounded-2xl shadow-2xl border backdrop-blur-xl" :style="{
				backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
				borderColor: currentTheme.colors.border
			}">
				<div class="p-6">
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div class="flex-shrink-0">
							<div class="w-12 h-12 rounded-xl flex items-center justify-center"
								:style="{ backgroundColor: currentTheme.colors.primary + '20' }">
								<svg class="w-6 h-6" :style="{ color: currentTheme.colors.primary }" fill="none"
									stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>

						<div class="flex-1 min-w-0">
							<h3 class="text-lg font-bold mb-1" :style="{ color: currentTheme.colors.text }">
								Help Rocus Become Better
							</h3>
							<p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
								We use privacy-first analytics to understand how Rocus is used. No personal data is
								collected,
								and you can opt out anytime in settings. To learn more, please refer to our <a
									href="/privacy" :style="{ color: currentTheme.colors.text }">Privacy Policy</a>
							</p>
						</div>

						<!-- Actions -->
						<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
							<button @click="decline" class="px-6 py-2.5 rounded-xl font-medium transition-all text-sm"
								:style="{
									backgroundColor: currentTheme.colors.background,
									color: currentTheme.colors.textSecondary
								}">
								No Thanks
							</button>
							<button @click="accept"
								class="px-6 py-2.5 rounded-xl font-medium transition-all text-sm shadow-lg" :style="{
									backgroundColor: currentTheme.colors.primary,
									color: '#fff'
								}">
								Accept & Help
							</button>
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
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { useAnalytics } from '../composables/useAnalytics';

const MODEL_CDN_BASE = 'https://models.rocus.io';

const availableModels = ref([
	{
		id: 'Qwen2.5-0.5B-Rocus',
		name: 'Fast (0.5B)',
		description: 'Runs on all devices, basic summaries',
		size: '~350MB',
		speed: 'Very Fast',
		quality: 'Basic',
		url: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC`, // base URL
		wasm: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC/Qwen2-0.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
		config: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC/mlc-chat-config.json`
	},
]);

const selectedModel = ref('Qwen2.5-0.5B-Rocus');
const engine = ref(null);
const modelLoadingProgress = ref(0);

const { analyticsConsent, setConsent, checkConsent, trackEvent } = useAnalytics();
const showBanner = ref(false);
function toggleAnalytics() {
	setConsent(!analyticsConsent.value);
}

function promptConsent() {
	const consent = localStorage.getItem('rocus-analytics-consent');
	if (consent === null) {
		setTimeout(() => {
			showBanner.value = true;
		}, 5000);
	}
}

function accept() {
	setConsent(true);
	showBanner.value = false;
}

function decline() {
	setConsent(false);
	showBanner.value = false;
}

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
const showAddToAlbumModal = ref(false);
const selectedAlbumForCluster = ref(null);
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
		name: 'Rocus Light',
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
		name: 'Rocus Dark',
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
		id: 'hangle',
		name: 'Hangle',
		description: 'https://hangle-geo.com',
		isDark: false,
		preview: ['#8fca5c', '#3ab3da', '#854f2b', '#ffffff'],
		colors: {
			background: '#8fca5c',
			surface: '#3ab3da',
			primary: '#854f2b',
			secondary: '#ffffff',
			accent: '#3ab3da',
			node: '#ffffff',
			nodeStroke: '#854f2b',
			text: '#ffffff',
			textSecondary: '#ffffff',
			border: '#854f2b'
		}
	},
	{
		id: 'scramble',
		name: 'Anagram Scramble',
		description: 'https://anagram-scramble.com',
		isDark: false,
		preview: ['#013b3f', '#ffae42', '#ffffe5', '#4d7cc3'],
		colors: {
			background: '#013b3f',
			surface: '#4d7cc3',
			primary: '#ffae42',
			secondary: '#ffffe5',
			accent: '#ffae42',
			node: '#ffffe5',
			nodeStroke: '#4d7cc3',
			text: '#ffffe5',
			textSecondary: '#ffae42',
			border: '#4d7cc3'
		}
	},
	{
		id: 'didi',
		name: 'Didi Greedy',
		description: 'Colorful and Wonderful',
		isDark: true,
		preview: ['#00A766', '#FF9FBF', '#2582B8', '#FFBC00'],
		colors: {
			background: '#00A766',      // green - main background
			surface: '#FFBC00',         // white - cards/panels
			primary: '#2582B8',         // orange - main interactive elements
			secondary: '#FF6C1F',       // blue - secondary elements
			accent: '#FFBC00',          // yellow - highlights
			node: '#FF6C1F',            // pink - the graph nodes
			nodeStroke: '#FF9FBF',      // blue - node borders
			text: '#FFFFFF',            // white - main text on green
			textSecondary: '#E0F2EC',   // very light green - secondary text
			border: '#FFBC00'           // yellow - borders
		}
	},
	{
		id: 'girly-pop',
		name: 'Girly Pop',
		description: 'Pink dreams and sparkles',
		isDark: false,
		preview: ['#FFE5F1', '#FF69B4', '#FFB6D9', '#FFF0F5'],
		colors: {
			background: '#FFF0F5',
			surface: '#FFE5F1',
			primary: '#FF69B4',
			secondary: '#FFB6D9',
			accent: '#FF1493',
			node: '#FFE5F1',
			nodeStroke: '#FFB6D9',
			text: '#C71585',
			textSecondary: '#DB7093',
			border: '#FFB6D9'
		}
	},
	{
		id: 'popped-out-80s',
		name: "Popped Out 80's",
		description: 'Neon nights',
		isDark: true,
		preview: ['#1A1A2E', '#FF006E', '#00F5FF', '#FFBE0B'],
		colors: {
			background: '#1A1A2E',
			surface: '#16213E',
			primary: '#FF006E',
			secondary: '#00F5FF',
			accent: '#FFBE0B',
			node: '#0F3460',
			nodeStroke: '#533483',
			text: '#FF006E',
			textSecondary: '#00F5FF',
			border: '#533483'
		}
	},
	{
		id: 'pink-lemonade',
		name: 'Pink Lemonade',
		description: 'Sweet and tangy',
		isDark: false,
		preview: ['#FFF8E7', '#FF6B9D', '#FFC6D9', '#FFFACD'],
		colors: {
			background: '#FFF8E7',
			surface: '#FFFACD',
			primary: '#FF6B9D',
			secondary: '#FFC6D9',
			accent: '#FFB347',
			node: '#FFF0F5',
			nodeStroke: '#FFB6C1',
			text: '#D63384',
			textSecondary: '#FF69B4',
			border: '#FFB6C1'
		}
	},
	{
		id: 'taro-bubble-tea',
		name: 'Taro Bubble Tea',
		description: 'Creamy purple goodness',
		isDark: false,
		preview: ['#F5F0FF', '#9B7EBD', '#C8B6E2', '#E5D4FF'],
		colors: {
			background: '#F5F0FF',
			surface: '#E5D4FF',
			primary: '#9B7EBD',
			secondary: '#C8B6E2',
			accent: '#7C5295',
			node: '#E5D4FF',
			nodeStroke: '#C8B6E2',
			text: '#5A3E7B',
			textSecondary: '#8B6EA8',
			border: '#C8B6E2'
		}
	},
	{
		id: 'base-model-white-f150',
		name: 'Base Model White 2008 4.6L F150 Supercrew',
		description: 'Lé Truck',
		isDark: false,
		preview: ['#F8F9FA', '#003478', '#FFFFFF', '#C0C0C0'],
		colors: {
			background: '#F8F9FA',
			surface: '#FFFFFF',
			primary: '#003478',
			secondary: '#0066CC',
			accent: '#C0C0C0',
			node: '#FFFFFF',
			nodeStroke: '#D3D3D3',
			text: '#2C3E50',
			textSecondary: '#5A6C7D',
			border: '#BDBDBD'
		}
	},
	{
		id: 'nyc',
		name: 'NYC',
		description: 'Empire State of mind',
		isDark: true,
		preview: ['#1C1C1E', '#FFD700', '#B8860B', '#2F2F2F'],
		colors: {
			background: '#1C1C1E',
			surface: '#2F2F2F',
			primary: '#FFD700',
			secondary: '#FFA500',
			accent: '#B8860B',
			node: '#3A3A3C',
			nodeStroke: '#48484A',
			text: '#FFD700',
			textSecondary: '#C0C0C0',
			border: '#48484A'
		}
	},
	{
		id: 'downtown-ramallah-night',
		name: 'Downtown Ramallah at Night',
		description: 'Warm vintage moonlight',
		isDark: true,
		preview: ['#1A1511', '#E8C547', '#D4A574', '#2C2416'],
		colors: {
			background: '#1A1511',
			surface: '#2C2416',
			primary: '#E8C547',
			secondary: '#D4A574',
			accent: '#F4A460',
			node: '#3D3020',
			nodeStroke: '#5C4B2A',
			text: '#E8C547',
			textSecondary: '#C9A961',
			border: '#5C4B2A'
		}
	},
	{
		id: 'old-city-birzeit',
		name: 'Birzeit Old City',
		description: 'Vintage stone, olive trees, and golden sun',
		isDark: false,
		preview: ['#E5D8C2', '#6B7A3A', '#D3A74A', '#F2E9D3'],
		colors: {
			background: '#F2E9D3',       // sun-washed limestone
			surface: '#E5D8C2',          // vintage stone wall
			primary: '#6B7A3A',          // old olive trees
			secondary: '#8C9B54',        // lighter leaf green
			accent: '#D3A74A',           // warm golden sun
			node: '#E5D8C2',             // stone node
			nodeStroke: '#CBBFA8',       // soft edge like aged stone
			text: '#3A3A2E',             // deep neutral for readability
			textSecondary: '#6F6B58',    // muted stone-gray
			border: '#CBBFA8'            // subtle stone border
		}
	},
	{
		id: 'burgundy-royale',
		name: 'Burgundy',
		description: 'Color of the year award',
		isDark: true,
		preview: ['#4A0E1F', '#FFFFFF', '#B43757', '#2E0A15'],
		colors: {
			background: '#4A0E1F',
			surface: '#2E0A15',
			primary: '#FFFFFF',
			secondary: '#B43757',
			accent: '#FFCCD5',
			node: '#3B0C19',
			nodeStroke: '#7A1E33',
			text: '#FFFFFF',
			textSecondary: '#E6B3C2',
			border: '#7A1E33'
		}
	},
	{
		id: 'lake-como',
		name: 'Lake Como',
		description: 'Je suis la bas',
		isDark: false,
		preview: ['#CFE6FA', '#1F73C8', '#7FB87A', '#F8E7B5'],
		colors: {
			background: '#CFE6FA',
			surface: '#F8F5EC',
			primary: '#1F73C8',
			secondary: '#7FB87A',
			accent: '#F2C94C',
			node: '#F8F5EC',
			nodeStroke: '#C7D7E4',
			text: '#1F2D36',
			textSecondary: '#54646E',
			border: '#C7D7E4'
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
		version: 'v1.0.1',
		date: 'December 9th 2025',
		current: true,
		features: [
			'Creating manual connections between clusters',
			'More comprehensive search that goes through description, metadata, and AI summary',
		],
		improvements: [
			'More themes to choose from',
		],
		bugFixes: [

		]
	},
	{
		version: 'v1.0.0',
		date: 'December 7th 2025',
		current: false,
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
const showCompatibilityCheck = ref(false);
const compatibilityResults = ref({
	webgpu: { status: 'checking', message: '' },
	memory: { status: 'checking', message: '' },
	indexeddb: { status: 'checking', message: '' },
	cache: { status: 'checking', message: '' },
	overall: 'checking'
});

// Add new tutorial steps for empty state
const tutorialStepsEmpty = [
	{
		title: 'Welcome to Rocus',
		description: 'Rocus automatically organizes your saved websites using AI. Let\'s walk through how it works.',
		highlight: null,
		action: null
	},
	{
		title: 'AI Models Loading',
		description: 'Rocus uses local AI models that run in your browser. They download once and work offline. AI runs entirely in your browser. First load may take ~30–60 seconds. The indicator shows green when models are ready to process websites.',
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
		title: 'Albums System',
		description: 'Create albums to organize your clusters by topic, project, or any way you like. Click here to switch between albums or create new ones.',
		highlight: 'albums-dropdown',
		action: null
	},
	{
		title: 'Your Graph Will Grow',
		description: 'Once you start saving websites, they\'ll appear here as interactive clusters. Similar websites are automatically grouped together, and you can see connections between topics.',
		highlight: 'graph-container',
		action: null
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
		title: 'Get Started',
		description: 'Install the browser extension and start saving websites. Watch as Rocus builds your intelligent knowledge graph automatically!',
		highlight: null,
		action: null
	}
];

async function checkSystemCompatibility() {
	compatibilityResults.value = {
		webgpu: { status: 'checking', message: 'Checking WebGPU support...' },
		memory: { status: 'checking', message: 'Checking available memory...' },
		indexeddb: { status: 'checking', message: 'Checking IndexedDB...' },
		cache: { status: 'checking', message: 'Checking Cache API...' },
		overall: 'checking'
	};

	let allPassed = true;

	try {
		if (!navigator.gpu) {
			compatibilityResults.value.webgpu = {
				status: 'error',
				message: 'WebGPU not supported. Your browser/device doesn\'t support WebGPU.',
				fix: 'Try Chrome/Edge 113+, or enable chrome://flags/#enable-unsafe-webgpu'
			};
			allPassed = false;
		} else {
			const adapter = await navigator.gpu.requestAdapter();
			if (!adapter) {
				compatibilityResults.value.webgpu = {
					status: 'error',
					message: 'WebGPU adapter not available. Hardware may not support it.',
					fix: 'Update your GPU drivers or try a different browser'
				};
				allPassed = false;
			} else {
				compatibilityResults.value.webgpu = {
					status: 'success',
					message: 'WebGPU supported ✓'
				};
			}
		}
	} catch (err) {
		compatibilityResults.value.webgpu = {
			status: 'error',
			message: `WebGPU check failed: ${err.message}`,
			fix: 'Try using Chrome/Edge in incognito mode or update your browser'
		};
		allPassed = false;
	}

	try {
		if (performance.memory) {
			const memoryMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
			if (memoryMB < 500) {
				compatibilityResults.value.memory = {
					status: 'warning',
					message: `Low memory available: ${Math.round(memoryMB)}MB. May be slow.`,
					fix: 'Close other tabs or restart your browser'
				};
			} else {
				compatibilityResults.value.memory = {
					status: 'success',
					message: `Memory OK: ${Math.round(memoryMB)}MB available ✓`
				};
			}
		} else {
			compatibilityResults.value.memory = {
				status: 'success',
				message: 'Memory check not available (non-Chrome browser) ✓'
			};
		}
	} catch (err) {
		compatibilityResults.value.memory = {
			status: 'warning',
			message: 'Could not check memory'
		};
	}

	try {
		const testDB = await new Promise((resolve, reject) => {
			const request = indexedDB.open('_rocus_test', 1);
			request.onsuccess = () => {
				request.result.close();
				indexedDB.deleteDatabase('_rocus_test');
				resolve(true);
			};
			request.onerror = () => reject(request.error);
		});
		compatibilityResults.value.indexeddb = {
			status: 'success',
			message: 'IndexedDB working ✓'
		};
	} catch (err) {
		compatibilityResults.value.indexeddb = {
			status: 'error',
			message: 'IndexedDB unavailable or blocked',
			fix: 'Enable cookies and site data in browser settings'
		};
		allPassed = false;
	}

	try {
		if ('caches' in window) {
			const cache = await caches.open('_rocus_test');
			await caches.delete('_rocus_test');
			compatibilityResults.value.cache = {
				status: 'success',
				message: 'Cache API working ✓'
			};
		} else {
			compatibilityResults.value.cache = {
				status: 'warning',
				message: 'Cache API not available',
				fix: 'This may affect model loading. Try incognito mode.'
			};
		}
	} catch (err) {
		if (err.message.includes('Cache') || err.message.includes('quota')) {
			compatibilityResults.value.cache = {
				status: 'error',
				message: 'Cache API error (common Chrome issue)',
				fix: 'Use incognito mode, or clear site data in Settings → Privacy'
			};
		} else {
			compatibilityResults.value.cache = {
				status: 'warning',
				message: `Cache check failed: ${err.message}`,
				fix: 'Try incognito mode if models fail to load'
			};
		}
	}

	compatibilityResults.value.overall = allPassed ? 'success' : 'error';

	return allPassed;
}

function startTutorialEmpty() {
	tutorialActive.value = true;
	tutorialStep.value = 0;
	// Use empty state tutorial steps
	const originalSteps = [...tutorialSteps];
	tutorialSteps.splice(0, tutorialSteps.length, ...tutorialStepsEmpty);

	// Store original steps to restore later
	window._originalTutorialSteps = originalSteps;

	updateTutorialHighlight();
}

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


const GOOGLE_SEARCH_API_URL = 'https://rocus.io/api/search';

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
const showAddConnection = ref(false);
const showRemoveConnection = ref(false);
const selectedConnectionCluster = ref(null);
const selectedConnectionToRemove = ref(null);
const connectionSearchTerm = ref('');


const availableClustersForConnection = computed(() => {
	if (!contextCluster.value) return [];

	const currentClusterId = contextCluster.value.id;
	const currentAlbumId = contextCluster.value.album_id;

	// Get all clusters in the same album
	let available = Object.values(clusters.value).filter(cluster =>
		cluster.id !== currentClusterId &&
		cluster.album_id === currentAlbumId
	);

	// Filter by search term
	if (connectionSearchTerm.value) {
		const term = connectionSearchTerm.value.toLowerCase();
		available = available.filter(cluster =>
			cluster.topic?.toLowerCase().includes(term)
		);
	}

	return available;
});

// Computed for connected clusters
const connectedClusters = computed(() => {
	if (!contextCluster.value) return [];

	const currentClusterId = contextCluster.value.id;
	const connections = [];

	// Find all manual connections
	if (clusters.value[currentClusterId]?.manual_connections) {
		const manualConnections = clusters.value[currentClusterId].manual_connections;
		for (const targetId of manualConnections) {
			const targetCluster = clusters.value[targetId];
			if (targetCluster) {
				connections.push({
					id: targetId,
					topic: targetCluster.topic,
					similarity: 8.0 // Manual connections shown as 100%
				});
			}
		}
	}

	// Find existing similarity-based connections
	if (rawSimilarities[currentClusterId]) {
		Object.entries(rawSimilarities[currentClusterId]).forEach(([targetId, similarity]) => {
			if (!connections.find(c => c.id === targetId)) {
				const targetCluster = clusters.value[targetId];
				if (targetCluster) {
					connections.push({
						id: targetId,
						topic: targetCluster.topic,
						similarity: similarity
					});
				}
			}
		});
	}

	return connections;
});

// Modal functions
function showAddConnectionModal() {
	showAddConnection.value = true;
	selectedConnectionCluster.value = null;
	connectionSearchTerm.value = '';
	showContextMenu.value = false;
}

function closeAddConnectionModal() {
	showAddConnection.value = false;
	selectedConnectionCluster.value = null;
	connectionSearchTerm.value = '';
}

function showRemoveConnectionModal() {
	showRemoveConnection.value = true;
	selectedConnectionToRemove.value = null;
	showContextMenu.value = false;
}

function closeRemoveConnectionModal() {
	showRemoveConnection.value = false;
	selectedConnectionToRemove.value = null;
}

async function confirmAddConnection() {
	if (!contextCluster.value || !selectedConnectionCluster.value) return;

	try {
		const sourceId = contextCluster.value.id;
		const targetId = selectedConnectionCluster.value;

		trackEvent('manual_connection_added');

		// Initialize manual_connections if not exists
		if (!clusters.value[sourceId].manual_connections) {
			clusters.value[sourceId].manual_connections = [];
		}

		// Add bidirectional connection
		if (!clusters.value[sourceId].manual_connections.includes(targetId)) {
			clusters.value[sourceId].manual_connections.push(targetId);
		}

		if (!clusters.value[targetId].manual_connections) {
			clusters.value[targetId].manual_connections = [];
		}

		if (!clusters.value[targetId].manual_connections.includes(sourceId)) {
			clusters.value[targetId].manual_connections.push(sourceId);
		}

		// Add to similarities for rendering
		if (!rawSimilarities[sourceId]) {
			rawSimilarities[sourceId] = {};
		}
		rawSimilarities[sourceId][targetId] = 1.0; // Manual connections = 100% similarity

		if (!rawSimilarities[targetId]) {
			rawSimilarities[targetId] = {};
		}
		rawSimilarities[targetId][sourceId] = 1.0;

		await saveToIndexedDB();
		await refreshData();

		closeAddConnectionModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error adding connection:', error);
		alert('Failed to add connection');
	}
}

async function confirmRemoveConnection() {
	if (!contextCluster.value || !selectedConnectionToRemove.value) return;

	try {
		const sourceId = contextCluster.value.id;
		const targetId = selectedConnectionToRemove.value;

		// Remove from manual connections
		if (clusters.value[sourceId]?.manual_connections) {
			const index = clusters.value[sourceId].manual_connections.indexOf(targetId);
			if (index > -1) {
				clusters.value[sourceId].manual_connections.splice(index, 1);
			}
		}

		if (clusters.value[targetId]?.manual_connections) {
			const index = clusters.value[targetId].manual_connections.indexOf(sourceId);
			if (index > -1) {
				clusters.value[targetId].manual_connections.splice(index, 1);
			}
		}

		// Remove from similarities
		if (rawSimilarities[sourceId]?.[targetId]) {
			delete rawSimilarities[sourceId][targetId];
		}

		if (rawSimilarities[targetId]?.[sourceId]) {
			delete rawSimilarities[targetId][sourceId];
		}

		await saveToIndexedDB();
		await refreshData();

		closeRemoveConnectionModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error removing connection:', error);
		alert('Failed to remove connection');
	}
}

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
				// Find the model status button - try multiple selectors
				const allButtons = document.querySelectorAll('button');
				// Look for button with computer/monitor icon or loading spinner
				element = Array.from(allButtons).find(btn => {
					const svg = btn.querySelector('svg');
					return svg && (
						svg.innerHTML.includes('M9.75 17L9 20') || // Computer icon path
						svg.innerHTML.includes('M4 4v5') // Loading spinner path
					);
				});
				// Fallback: 3rd button in header
				if (!element) {
					const buttons = document.querySelectorAll('.flex.items-center.gap-3 button');
					element = buttons[2];
				}
				break;

			case 'albums-dropdown':
				element = document.querySelector('.flex-1.max-w-2xl .relative button') ||
					document.querySelector('button[class*="w-full"]');
				break;

			case 'graph-container':
				element = document.getElementById('graph-container');
				break;

			case 'demo-cluster':
				// Only try to highlight if we have clusters
				if (tutorialDemoCluster.value && container) {
					const node = container.select('.nodes')
						.selectAll('.node')
						.filter(d => d.id === tutorialDemoCluster.value.id)
						.node();
					element = node;
				}

				// Fallback to graph container if no demo cluster
				if (!element) {
					element = document.getElementById('graph-container');
				}
				break;

			case 'theme-button':
				// Theme button is 1st button in header - look for palette icon
				const headerButtons = document.querySelectorAll('button');
				element = Array.from(headerButtons).find(btn => {
					const svg = btn.querySelector('svg');
					return svg && svg.innerHTML.includes('M7 21a4 4'); // Palette icon path
				});
				// Fallback: first button
				if (!element) {
					element = document.querySelectorAll('.flex.items-center.gap-3 button')[0];
				}
				break;

			case 'search-bar':
				element = document.querySelector('.fixed.top-24') ||
					document.querySelector('input[type="text"]');
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
		} else {
			// If element not found, clear highlight
			console.warn(`Tutorial element not found: ${step.highlight}`);
			tutorialHighlightRect.value = { top: 0, left: 0, width: 0, height: 0 };
		}
	}, 100);
}

function performTutorialAction() {
	const step = tutorialSteps[tutorialStep.value];

	if (step.action === 'showDemoCluster') {
		// Check if we have clusters
		if (graphData?.nodes?.length > 0) {
			const clusterNodes = graphData.nodes.filter(n => n.type === 'cluster');
			if (clusterNodes.length > 0) {
				tutorialDemoCluster.value = clusterNodes[0];
				updateTutorialHighlight();
			} else {
				// No clusters, skip to next step
				console.log("No clusters available, skipping demo");
				nextTutorialStep();
			}
		} else {
			// No data at all, skip to next step
			console.log("No graph data, skipping demo");
			nextTutorialStep();
		}
	} else if (step.action === 'explodeDemoCluster') {
		// Only explode if we have a demo cluster with websites
		if (tutorialDemoCluster.value && tutorialDemoCluster.value.websites?.length > 0) {
			explodeNode(tutorialDemoCluster.value);
		} else {
			// Can't demonstrate, skip to next step
			console.log("No websites to explode, skipping demo");
			nextTutorialStep();
		}
	} else if (step.action === 'cleanup') {
		// Collapse any exploded node
		if (tutorialDemoCluster.value) {
			collapseNode();
			tutorialDemoCluster.value = null;
		}

		// Restore original tutorial steps if we used empty state version
		if (window._originalTutorialSteps) {
			tutorialSteps.splice(0, tutorialSteps.length, ...window._originalTutorialSteps);
			delete window._originalTutorialSteps;
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
		trackEvent('data_exported');
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

		trackEvent('album_created');

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

function showAddToAlbumModalFunction() {
	selectedAlbumForCluster.value = contextCluster.value?.album_id || null;
	showAddToAlbumModal.value = true;
	showContextMenu.value = false;
}

function closeAddToAlbumModal() {
	showAddToAlbumModal.value = false;
	selectedAlbumForCluster.value = null;
}

async function confirmAddToAlbum() {
	if (!contextCluster.value || !selectedAlbumForCluster.value) return;

	try {
		const clusterId = contextCluster.value.id;
		const albumId = selectedAlbumForCluster.value;

		// Update cluster's album_id
		clusters.value[clusterId].album_id = albumId;

		// Update all websites in this cluster
		for (const websiteId of clusters.value[clusterId].websites) {
			if (websites.value[websiteId]) {
				websites.value[websiteId].album_id = albumId;
			}
		}

		await saveToIndexedDB();
		await refreshData();

		closeAddToAlbumModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error adding cluster to album:', error);
		alert('Failed to add cluster to album');
	}
}

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

		// FIRST: Preserve manual connections
		for (const sourceClusterId of clusterIds) {
			const sourceCluster = clusters.value[sourceClusterId];
			if (!sourceCluster) continue;

			similarities[sourceClusterId] = {};

			// Add manual connections with similarity of 1.0
			if (sourceCluster.manual_connections && sourceCluster.manual_connections.length > 0) {
				for (const targetId of sourceCluster.manual_connections) {
					if (clusterIds.includes(targetId)) {
						similarities[sourceClusterId][targetId] = 1.0;
					}
				}
			}
		}

		// THEN: Calculate embedding-based similarities
		for (const sourceClusterId of clusterIds) {
			const sourceCluster = clusters.value[sourceClusterId];
			if (!sourceCluster || !sourceCluster.websites.length) continue;

			const sourceWebsiteIds = sourceCluster.websites;
			const sourceEmbeddings = sourceWebsiteIds
				.map((id) => embeddings.value[id])
				.filter(Boolean);

			if (sourceEmbeddings.length === 0) continue;

			const sourceAvgEmbedding = averageEmbeddings(sourceEmbeddings);

			for (const targetClusterId of clusterIds) {
				if (sourceClusterId === targetClusterId) continue;

				// Skip if manual connection already exists
				if (similarities[sourceClusterId][targetClusterId]) continue;

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


async function googleSearch(query, numResults = 10) {
	if (!query || !query.trim()) {
		console.warn("Empty search query");
		return [];
	}

	try {
		console.log(`🔍 Searching Google via backend API for: '${query}'`);

		// Call your Node.js backend instead of Cloudflare Worker
		const url = new URL(GOOGLE_SEARCH_API_URL);
		url.searchParams.set('q', query);
		url.searchParams.set('num', numResults.toString());

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include' // Include credentials for CORS
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			// Handle rate limiting
			if (response.status === 429) {
				console.warn('⚠️ Rate limit exceeded. Please try again later.');
				throw new Error('Rate limit exceeded. Please try again in 15 minutes.');
			}

			throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success || !data.results) {
			throw new Error('Invalid response from search API');
		}

		console.log(`✅ Found ${data.results.length} search results`);
		return data.results;

	} catch (error) {
		console.error(`⚠️ Google search error for query '${query}':`, error);

		// You can throw the error to handle it in the calling code
		// or return empty array as before
		if (error.message.includes('Rate limit')) {
			throw error; // Propagate rate limit errors
		}

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

	// Deep search: clusters + websites + metadata + summaries
	const matchingNodes = graphData.nodes.filter(node => {
		if (node.type === 'cluster') {
			// Search cluster topic
			if (node.topic?.toLowerCase().includes(term)) return true;

			// Search within cluster's websites
			return node.websites?.some(website => {
				const title = website.title?.toLowerCase() || '';
				const url = website.url?.toLowerCase() || '';
				const domain = website.domain?.toLowerCase() || '';

				// Get full website data for deep search
				const fullWebsite = websites.value[website.id];
				if (fullWebsite) {
					const summary = fullWebsite.ai_summary?.toLowerCase() || '';
					const description = fullWebsite.metadata?.description?.toLowerCase() || '';
					const keywords = fullWebsite.metadata?.keywords?.toLowerCase() || '';

					return title.includes(term) ||
						url.includes(term) ||
						domain.includes(term) ||
						summary.includes(term) ||
						description.includes(term) ||
						keywords.includes(term);
				}

				return title.includes(term) || url.includes(term) || domain.includes(term);
			});
		}

		if (node.type === 'website') {
			const title = node.title?.toLowerCase() || '';
			const url = node.url?.toLowerCase() || '';
			const domain = node.domain?.toLowerCase() || '';

			// Get full website data
			const fullWebsite = websites.value[node.websiteId];
			if (fullWebsite) {
				const summary = fullWebsite.ai_summary?.toLowerCase() || '';
				const description = fullWebsite.metadata?.description?.toLowerCase() || '';
				const keywords = fullWebsite.metadata?.keywords?.toLowerCase() || '';

				return title.includes(term) ||
					url.includes(term) ||
					domain.includes(term) ||
					summary.includes(term) ||
					description.includes(term) ||
					keywords.includes(term);
			}

			return title.includes(term) || url.includes(term) || domain.includes(term);
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
	trackEvent('cluster_exploded', {
		website_count: clusterNode.websites.length
	});
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

	trackEvent('discover_similar_clicked', {
		website_count: explodedNode.value.websites.length
	});

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
		manual_connections: [],
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

		trackEvent('website_saved', {
			has_album: !!data.album
		});

		await refreshData();

		console.log(`✅ Processed: ${websiteId}`);
		promptConsent();
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

async function clearModelCache() {
	const confirmed = confirm(
		'Reset AI Model Cache?\n\n' +
		'This will delete downloaded AI models (~300–700MB) and reload the app.\n\n' +
		'Your bookmarks, topics, clusters, and albums will NOT be deleted.'
	);

	if (!confirmed) return;

	try {
		// Delete only WebLLM / MLC IndexedDB databases
		if (indexedDB.databases) {
			const databases = await indexedDB.databases();
			for (const db of databases) {
				if (
					db.name &&
					(
						db.name.startsWith('webllm/') ||
						db.name.startsWith('webllm') ||
						db.name.includes('mlc')
					)
				) {
					console.log('Deleting IndexedDB:', db.name);
					indexedDB.deleteDatabase(db.name);
				}
			}
		}

		// Clear related Cache Storage entries
		if ('caches' in window) {
			const keys = await caches.keys();
			for (const key of keys) {
				if (key.includes('webllm') || key.includes('mlc')) {
					console.log('Deleting cache:', key);
					await caches.delete(key);
				}
			}
		}

		alert('✅ AI model cache cleared.\n\nReloading…');
		location.reload();

	} catch (err) {
		console.error('Failed to clear AI cache:', err);
		alert(
			'⚠️ Could not fully reset AI cache automatically.\n\n' +
			'Please clear site data for rocus.io in browser settings.'
		);
	}
}


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


		// Load Web-LLM from self-hosted CDN
		loadingMessage.value = "Loading AI model from Rocus CDN...";
		const modelConfig = availableModels.value.find(m => m.id === selectedModel.value);
		if (!modelConfig) throw new Error('Model configuration not found');

		console.log(`Loading model from: ${modelConfig.url}`);

		const customModelRecord = {
			model: modelConfig.url,
			model_id: selectedModel.value,
			model_lib: modelConfig.wasm,
		};

		summarizationModel = await CreateMLCEngine(
			selectedModel.value, // 'Qwen2.5-0.5B-Rocus'
			{
				initProgressCallback: (progress) => {
					if (progress && typeof progress.progress === 'number') {
						modelLoadingProgress.value = Math.round(progress.progress * 100);
					}
					if (progress && progress.text) {
						loadingMessage.value = progress.text;
						console.log(`📦 ${progress.text}`);
					}
				},
				appConfig: {
					useIndexedDBCache: true,
					model_list: [customModelRecord],
				},
				logLevel: 'WARN',
			}
		);

		console.log('✅ Model loaded from Rocus CDN');

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
		modelLoading.value = false;
		error.value = err.message || "Failed to load AI models";

		let errorMessage = 'AI Models Failed to Load\n\n';

		if (err.message.includes('QuotaExceededError') || err.message.includes('quota') || err.message.includes('storage')) {
			errorMessage +=
				'❌ Problem: Browser storage is full\n\n' +
				'✅ Quick Fix:\n' +
				'1. Go to Settings (⚙️ icon)\n' +
				'2. Click "Clear AI Model Cache"\n' +
				'3. Models will re-download fresh\n\n' +
				'Or manually: Chrome Settings → Privacy → Clear browsing data';
		} else if (err.message.includes('WebGPU not supported')) {
			errorMessage +=
				'❌ Problem: Your browser doesn\'t support WebGPU\n\n' +
				'✅ Solutions:\n' +
				'1. Update Chrome to version 113+ (Help → About Chrome)\n' +
				'2. Enable chrome://flags/#enable-unsafe-webgpu\n' +
				'3. Restart browser after enabling\n\n' +
				'Older computers (pre-2016) may not support WebGPU.';
		} else if (err.message.includes('No GPU adapter')) {
			errorMessage +=
				'❌ Problem: Hardware doesn\'t support WebGPU\n\n' +
				'✅ What to try:\n' +
				'1. Update GPU drivers from manufacturer site\n' +
				'2. Check chrome://gpu shows "WebGPU: Hardware accelerated"\n' +
				'3. Try different browser (Edge, Firefox Nightly)\n\n' +
				'Very old hardware (2015 or older) is a hit or miss.';
		} else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
			errorMessage +=
				'❌ Problem: Network or cache error\n\n' +
				'✅ Solutions:\n' +
				'1. Try Incognito mode (Ctrl+Shift+N)\n' +
				'2. Clear cache in Settings\n' +
				'3. Check internet connection\n' +
				'4. Disable VPN/ad blockers temporarily';
		} else {
			errorMessage +=
				`❌ Error: ${err.message}\n\n` +
				'✅ Try this:\n' +
				'1. Clear AI cache in Settings (⚙️)\n' +
				'2. Try Incognito mode\n' +
				'3. Restart browser\n' +
				'4. Check chrome://gpu for issues';
		}


		error.value = errorMessage;      // set the error text
		showModelStatus.value = true;    // open the modal
		modelLoading.value = false;      // stop loading state

		return;

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

async function checkAndRepairDatabase() {
	try {
		const testDB = await new Promise((resolve, reject) => {
			const request = indexedDB.open('_health_check_', 1);
			request.onsuccess = () => {
				request.result.close();
				indexedDB.deleteDatabase('_health_check_');
				resolve(true);
			};
			request.onerror = () => reject(request.error);
			request.onblocked = () => reject(new Error('IndexedDB blocked'));
		});

		console.log('✅ IndexedDB health check passed');
		return true;

	} catch (error) {
		console.error('❌ IndexedDB corruption detected:', error);

		const shouldReset = confirm(
			'Database Error Detected\n\n' +
			'Your browser storage appears corrupted. This happens when:\n' +
			'• Browser crashed during save\n' +
			'• Multiple tabs competed for storage\n' +
			'• Storage quota exceeded\n\n' +
			'Click OK to reset and fix the issue.\n' +
			'Click Cancel to try manual fixes first.'
		);

		if (shouldReset) {
			await resetDatabase();
			location.reload();
		} else {
			alert(
				'Manual Fix Instructions:\n\n' +
				'Windows:\n' +
				'1. Close ALL browser windows\n' +
				'2. Delete: %USERPROFILE%\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\IndexedDB\n' +
				'3. Restart browser\n\n' +
				'Mac:\n' +
				'1. Close ALL browser windows\n' +
				'2. Delete: ~/Library/Application Support/Google/Chrome/Default/IndexedDB\n' +
				'3. Restart browser\n\n' +
				'Or use Chrome DevTools:\n' +
				'F12 → Application → Storage → Clear site data'
			);
		}

		return false;
	}
}

async function resetDatabase() {
	try {
		console.log('Resetting database...');

		// Close all DB connections
		if (db) {
			db.close();
			db = null;
		}

		// Clear IndexedDB
		const databases = await indexedDB.databases();
		for (const dbInfo of databases) {
			if (dbInfo.name && (dbInfo.name.includes('FunkyAIDB') || dbInfo.name.includes('mlc'))) {
				await new Promise((resolve, reject) => {
					const request = indexedDB.deleteDatabase(dbInfo.name);
					request.onsuccess = () => resolve();
					request.onerror = () => reject(request.error);
					request.onblocked = () => {
						console.warn(`Blocked deleting ${dbInfo.name}, forcing...`);
						setTimeout(resolve, 1000);
					};
				});
				console.log(`Deleted database: ${dbInfo.name}`);
			}
		}

		if ('caches' in window) {
			const cacheNames = await caches.keys();
			for (const name of cacheNames) {
				await caches.delete(name);
				console.log(`Deleted cache: ${name}`);
			}
		}

		localStorage.clear();

		console.log('Database reset complete');

	} catch (error) {
		console.error('Reset failed:', error);
		alert('Automatic reset failed. Please manually clear site data:\n\n' +
			'Chrome DevTools (F12) → Application → Storage → Clear site data');
	}
}

onMounted(async () => {
	try {
		window.addEventListener('keydown', handleKeyDown);
		document.addEventListener('click', handleClickOutside);

		platform.value = detectPlatform();

		console.log("Component mounted, initializing...");

		await initDB();
		loadThemePreference();
		console.log("✅ IndexedDB ready");

		await loadFromIndexedDB();

		initializeGraph();
		window.addEventListener("resize", handleResize);

		messageListener = setupMessageListener();
		console.log("✅ Message listener ready");

		const tutorialCompleted = localStorage.getItem('rocus-tutorial-completed');

		// Check system compatibility first
		const compatibilityCheckDone = localStorage.getItem('rocus-compatibility-checked');
		if (!compatibilityCheckDone) {
			showCompatibilityCheck.value = true;
			await checkSystemCompatibility();

			// Auto-close if all passed after 3 seconds
			if (compatibilityResults.value.overall === 'success') {
				setTimeout(() => {
					showCompatibilityCheck.value = false;
					localStorage.setItem('rocus-compatibility-checked', 'true');

					// Start tutorial if not completed
					if (!tutorialCompleted) {
						setTimeout(() => {
							if (graphData?.nodes?.length > 0) {
								startTutorial();
							} else {
								startTutorialEmpty();
							}
						}, 500);
					}
				}, 3000);
			}
		} else if (!tutorialCompleted) {
			// Skip straight to tutorial if compatibility already checked
			setTimeout(() => {
				if (graphData?.nodes?.length > 0) {
					startTutorial();
				} else {
					startTutorialEmpty();
				}
			}, 2000);
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