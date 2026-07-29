<template>
	<div class="w-screen h-screen relative overflow-hidden font-sans transition-all duration-300"
		:style="{ backgroundColor: currentTheme.colors.background }"
		@dragenter="handleDragEnter" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop.prevent="handleDrop">
		<div v-if="showDropOverlay" class="fixed inset-0 z-[1500] flex items-center justify-center pointer-events-none animate-fadeIn"
			:style="{ backgroundColor: 'rgba(0,0,0,0.35)' }">
			<div class="flex flex-col items-center gap-4">
				<div class="w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed"
					:style="{ borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }">
					<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
				</div>
				<p class="text-white text-lg font-semibold">Drop files for Rocus</p>
			</div>
		</div>
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
								<div v-if="dropdownMode === 'history'" class="w-8 h-8 shrink-0" :style="badgeVars">
									<div v-if="currentHistoryDay" class="cal-chip">
										<span class="cal-chip__m">{{ historyBadge.month }}</span>
										<span class="cal-chip__d">{{ historyBadge.day }}</span>
									</div>
									<div v-else class="globe-chip"><i></i></div>
								</div>
								<img v-else-if="currentAlbum?.icon" :src="getIconUrl(currentAlbum.icon)" alt="Album icon"
									class="w-8 h-8 object-contain" />
								<img v-else src="./images/RocusFileIconColored.png" alt="Album icon"
									class="w-8 h-8 object-contain" />

								<div class="text-left">
									<div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
										{{ dropdownMode === 'history'
											? (currentHistoryDay ? formatDayLabel(currentHistoryDay) : 'All Clusters')
											: (currentAlbum ? currentAlbum.name : 'All Clusters') }}
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
							<!-- Minimal Albums / History switch -->
							<div class="px-3 pt-3 pb-1">
								<div class="relative flex rounded-full p-0.5"
									:style="{ backgroundColor: currentTheme.colors.background, border: `1px solid ${currentTheme.colors.border}` }">
									<div class="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#4A90E2] transition-transform duration-200 ease-out"
										:style="{ transform: dropdownMode === 'history' ? 'translateX(100%)' : 'translateX(0)' }"></div>
									<button @click.stop="setDropdownMode('albums')"
										class="relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200"
										:style="{ color: dropdownMode === 'albums' ? '#fff' : currentTheme.colors.textSecondary }">
										Albums
									</button>
									<button @click.stop="setDropdownMode('history')"
										class="relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200"
										:style="{ color: dropdownMode === 'history' ? '#fff' : currentTheme.colors.textSecondary }">
										History
									</button>
								</div>
							</div>

							<button @click="selectAllClusters"
								class="w-full flex items-center gap-3 px-4 py-3 transition-colors group"
								:style="{ color: currentTheme.colors.text }" :class="{
									'bg-[#4A90E2]/10': !currentAlbum && !currentHistoryDay,
								}">
								<div class="w-8 h-8 shrink-0" :style="badgeVars">
									<div class="globe-chip"><i></i></div>
								</div>
								<div class="flex-1 text-left">
									<div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
										All Clusters
									</div>
									<div class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">View
										everything</div>
								</div>
								<svg v-if="!currentAlbum && !currentHistoryDay" class="w-5 h-5 text-[#4A90E2]" fill="currentColor"
									viewBox="0 0 20 20">
									<path fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd" />
								</svg>
							</button>

							<div class="h-px mx-4" :style="{ backgroundColor: currentTheme.colors.border }"></div>

							<template v-if="dropdownMode === 'albums'">
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
							</template>

							<template v-else>
								<div class="max-h-64 overflow-y-auto">
									<button v-if="historyDays.length === 0"
										class="w-full px-4 py-3 text-sm text-center cursor-default"
										:style="{ color: currentTheme.colors.textSecondary }">
										No processed clusters yet
									</button>
									<button v-for="day in historyDays" :key="day.key" @click="selectHistoryDay(day.key)"
										class="w-full flex items-center gap-3 px-4 py-3 transition-colors group" :class="{
											'bg-[#4A90E2]/10': currentHistoryDay === day.key,
										}">
										<div class="w-8 h-8 shrink-0" :style="badgeVars">
											<div class="cal-chip">
												<span class="cal-chip__m">{{ computeDayBadge(day.key).month }}</span>
												<span class="cal-chip__d">{{ computeDayBadge(day.key).day }}</span>
											</div>
										</div>
										<div class="flex-1 text-left">
											<div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
												{{ day.label }}
											</div>
											<div class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
												{{ day.count }} {{ day.count === 1 ? 'cluster' : 'clusters' }}
											</div>
										</div>
										<svg v-if="currentHistoryDay === day.key" class="w-5 h-5 text-[#4A90E2]"
											fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd" />
										</svg>
									</button>
								</div>
							</template>
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

					<div class="relative uploads-panel-container">
						<button @click.stop="toggleUploadsPanel" class="p-2.5 rounded-xl transition-all"
							:style="{ backgroundColor: currentTheme.colors.surface }">
							<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
								stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</button>

						<div v-if="showUploadsPanel"
							class="absolute top-full right-0 mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fadeIn"
							:style="{ backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }">
							<div class="px-4 py-3 border-b" :style="{ borderColor: currentTheme.colors.border }">
								<div class="text-sm font-semibold" :style="{ color: currentTheme.colors.text }">My Files</div>
							</div>
							<div class="max-h-72 overflow-y-auto">
								<div v-if="uploadedFilesWithTopics.length === 0" class="px-4 py-6 text-sm text-center"
									:style="{ color: currentTheme.colors.textSecondary }">
									No files uploaded yet
								</div>
								<div v-for="group in filesByTopic" :key="group.topic">
									<div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide"
										:style="{ color: currentTheme.colors.textSecondary }">
										{{ group.topic }}
									</div>
									<div v-for="file in group.files" :key="file.id"
										class="flex items-center gap-3 px-4 py-3 group">
										<span class="text-xl">📄</span>
										<div class="flex-1 min-w-0">
											<div class="text-sm font-medium truncate" :style="{ color: currentTheme.colors.text }">
												{{ file.original_name }}
											</div>
											<div class="text-xs truncate" :style="{ color: currentTheme.colors.textSecondary }">
												{{ formatDate(file.created_at) }}
											</div>
										</div>
										<button @click="downloadFile(file.id)" title="Download"
											class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
											:style="{ color: currentTheme.colors.textSecondary }">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
													d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

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
						<svg v-if="showModelLoadingIndicator" class="w-5 h-5 text-[#4A90E2] animate-spin" fill="none"
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
						<div v-if="!showModelLoadingIndicator && !error"
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
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-4 animate-fadeIn">
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
							<span v-if="summarizationModel || processingMode === 'commercial'"
								class="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
								{{ processingMode === 'commercial' ? 'Cloud' : 'Loaded' }}
							</span>
							<span v-else class="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">
								Not Loaded
							</span>
						</div>
						<p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
							{{ processingMode === 'commercial' ? 'Cloud Processing' : 'Self-Hosted' }}
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

					<div class="flex items-center justify-between">
						<div>
							<div class="font-medium flex items-center gap-2"
								:style="{ color: currentTheme.colors.text }">
								AI Processing
							</div>
							<div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
								Cloud AI Processing, or your own on-device model.
							</div>
						</div>
						<div class="relative flex rounded-full p-0.5 w-36 shrink-0" :style="{
							backgroundColor: currentTheme.colors.background,
							border: `1px solid ${currentTheme.colors.border}`
						}">
							<div class="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#4A90E2] transition-transform duration-200 ease-out"
								:style="{ transform: processingMode === 'local' ? 'translateX(100%)' : 'translateX(0)' }"></div>
							<button @click="setProcessingMode('commercial')"
								class="relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200"
								:style="{ color: processingMode === 'commercial' ? '#fff' : currentTheme.colors.textSecondary }">
								Cloud
							</button>
							<button @click="setProcessingMode('local')"
								class="relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200"
								:style="{ color: processingMode === 'local' ? '#fff' : currentTheme.colors.textSecondary }">
								Local
							</button>
						</div>
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
		<div id="graph-container" ref="graphContainer" @click="handleBackgroundClick(); handleGraphLeftClick($event)"
			@contextmenu.prevent="handleGraphRightClick"
			class="w-full h-full pt-20 cursor-grab active:cursor-grabbing"></div>

		<!-- "+" prompt after a right click on empty canvas (triple left-click opens the note creator directly) -->
		<div v-if="showAddNotePrompt" class="fixed z-[1400] animate-fadeIn"
			:style="{ ...addNotePromptStyle, transform: 'translate(-50%, -50%)' }">
			<button @click.stop="confirmAddNoteFromPrompt" title="Add a note here"
				class="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
				:style="{ backgroundColor: currentTheme.colors.primary }">
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		</div>

		<!-- Create/edit note modal -->
		<div v-if="showNoteModal" @click="closeNoteModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					{{ editingNoteId ? 'Edit Note' : 'New Note' }}
				</h3>

				<textarea v-model="noteForm.text" rows="5" placeholder="Write your note here"
					class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none transition-all resize-none"
					:style="{
						backgroundColor: currentTheme.colors.background,
						borderColor: currentTheme.colors.border,
						color: currentTheme.colors.text
					}"></textarea>

				<div v-if="!editingNoteId" class="mt-3">
					<div class="text-xs font-medium mb-1.5" :style="{ color: currentTheme.colors.textSecondary }">
						Add to
					</div>
					<div class="flex flex-wrap gap-2">
						<button v-for="suggestion in noteSuggestions" :key="suggestion.clusterId"
							@click="toggleSuggestion(suggestion.clusterId)"
							class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all" :style="{
								backgroundColor: selectedSuggestionClusterId === suggestion.clusterId ? currentTheme.colors.primary : currentTheme.colors.background,
								borderColor: selectedSuggestionClusterId === suggestion.clusterId ? currentTheme.colors.primary : currentTheme.colors.border,
								color: selectedSuggestionClusterId === suggestion.clusterId ? '#ffffff' : currentTheme.colors.text
							}">
							{{ suggestion.topic }}
						</button>


						<button @click="toggleSuggestion(NOTES_HUB_SENTINEL)"
							class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all" :style="{
								backgroundColor: selectedSuggestionClusterId === NOTES_HUB_SENTINEL ? currentTheme.colors.primary : currentTheme.colors.background,
								borderColor: selectedSuggestionClusterId === NOTES_HUB_SENTINEL ? currentTheme.colors.primary : currentTheme.colors.border,
								color: selectedSuggestionClusterId === NOTES_HUB_SENTINEL ? '#ffffff' : currentTheme.colors.text
							}">
							Notes
						</button>

						
					</div>
				</div>

				<div class="flex gap-3 mt-6">
					<button @click="closeNoteModal" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
						:style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
					<button @click="saveNote"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all shadow-lg shadow-[#4A90E2]/30">
						{{ editingNoteId ? 'Save' : 'Create' }}
					</button>
				</div>
			</div>
		</div>

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

			<button @click="showAddToAlbumModalFunction"
				class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
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

		<!-- Website Node Context Menu -->
		<div v-if="showWebsiteContextMenu" @click.stop
			class="fixed z-[2500] rounded-xl shadow-2xl border overflow-hidden min-w-[180px] animate-scaleIn" :style="{
				...contextMenuStyle,
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
			<button @click="editWebsiteTitle" class="w-full flex items-center gap-3 px-4 py-3 transition-colors"
				:style="{ color: currentTheme.colors.text }">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
				<span class="text-sm font-medium">Edit Title</span>
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

		<!-- Delete Cluster Modal -->
		<div v-if="showDeleteClusterModal" @click="closeDeleteClusterModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn border" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<h3 class="text-2xl font-bold mb-3" :style="{ color: currentTheme.colors.text }">
					Delete Cluster
				</h3>
				<p class="text-sm mb-6" :style="{ color: currentTheme.colors.textSecondary }">
					Delete "{{ contextCluster?.topic }}"? Choose what happens to its websites.
				</p>
				<div class="flex flex-col gap-3">
					<button @click="confirmDeleteCluster(false)"
						class="w-full px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.text
						}">
						Delete cluster only <span class="font-normal opacity-70">(keep the websites)</span>
					</button>
					<button @click="confirmDeleteCluster(true)"
						class="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all">
						Delete cluster and all its websites
					</button>
					<button @click="closeDeleteClusterModal"
						class="w-full px-6 py-3 rounded-xl font-medium transition-all" :style="{
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
				</div>
			</div>
		</div>

		<!-- Edit Website Title Modal -->
		<div v-if="showWebsiteEditModal" @click="closeWebsiteEditModal"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
			<div @click.stop class="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn border" :style="{
				backgroundColor: currentTheme.colors.surface,
				borderColor: currentTheme.colors.border
			}">
				<h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
					Edit Website Title
				</h3>
				<input v-model="websiteTitleInput" @keyup.enter="confirmWebsiteEdit" type="text"
					placeholder="Website title" class="w-full px-4 py-3 border rounded-xl outline-none transition-all"
					:style="{
						backgroundColor: currentTheme.colors.background,
						borderColor: currentTheme.colors.border,
						color: currentTheme.colors.text
					}" />
				<div class="flex gap-3 mt-6">
					<button @click="closeWebsiteEditModal"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
							backgroundColor: currentTheme.colors.background,
							color: currentTheme.colors.textSecondary
						}">
						Cancel
					</button>
					<button @click="confirmWebsiteEdit"
						class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all">
						Save
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
				<h3 class="text-2xl capitalize font-bold mb-6" :style="{ color: currentTheme.colors.text }">
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
							<div class="font-medium capitalize" :style="{ color: currentTheme.colors.text }">
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
				<h3 class="text-2xl font-bold mb-6 capitalize" :style="{ color: currentTheme.colors.text }">
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
							<div class="font-medium capitalize" :style="{ color: currentTheme.colors.text }">
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

				<div class="flex items-center gap-1 flex-shrink-0">
					<button @click="deleteSelectedWebsite" title="Delete"
						class="p-1.5 rounded-lg hover:bg-yellow-200 transition-all">
						<svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
					<button @click="closeStickyNote"
						class="p-1.5 rounded-lg hover:bg-yellow-200 transition-all">
						<svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div class="p-4 space-y-3 text-sm text-gray-800">
				<!-- <div>
					<span class="font-semibold">Cluster ID:</span>
					{{ selectedWebsite.parentCluster }}
				</div> -->

				<div v-if="!selectedWebsite.is_note">
					<span class="font-semibold">Domain:</span>
					{{ selectedWebsite.domain }}
				</div>

				<div v-if="websiteDetails && !selectedWebsite.is_note">
					<span class="font-semibold">Description:</span>
					{{ websiteDetails.ai_summary || "None" }}
				</div>

				<div v-if="selectedWebsite.is_note" class="whitespace-pre-wrap text-sm text-gray-800 py-2">
					{{ selectedWebsite.note_text }}
				</div>
				<div v-else-if="selectedWebsite.is_file" @click="downloadFile(selectedWebsite.file_id)"
					class="cursor-pointer transition-all hover:shadow-md"
					>
					<!-- Title -->
					<div class="font-semibold text-sm" :class="isDarkMode ? 'text-gray-800' : 'text-gray-700'">
						{{ websiteDetails?.metadata?.title || selectedWebsite.domain }}
					</div>

					<!-- Description -->
					<div class="text-xs mt-1 line-clamp-2" :style="{ color: currentTheme.colors.textSecondary }">
						{{ websiteDetails?.metadata?.description || "No description available" }}
					</div>
				</div>
				<a v-else :href="selectedWebsite.url" target="_blank" class="cursor-pointer transition-all hover:shadow-md"
					>
					<!-- Image -->
					<div v-if="websiteDetails?.metadata?.image"
						class="w-full my-4 h-36 mb-2 overflow-hidden rounded-lg">
						<img :src="websiteDetails.metadata.image" class="w-full h-full object-cover" alt="preview" />
					</div>

					<!-- Title -->
					<div class="font-semibold text-sm" :style="{ color: currentTheme.colors.textSecondary }">
						{{ websiteDetails?.metadata?.title || selectedWebsite.domain }}
					</div>

					<!-- Description -->
					<div class="text-xs mt-1 line-clamp-2" :style="{ color: currentTheme.colors.textSecondary }">
						{{ websiteDetails?.metadata?.description || "No description available" }}
					</div>

					<!-- Domain -->
					<div class="text-xs mt-2 flex items-center gap-1"
						:class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
						🌐 {{ selectedWebsite.domain }}
					</div>
				</a>


				<button v-if="selectedWebsite.is_note"
					@click="openNoteEditor({ id: selectedWebsite.websiteId, text: selectedWebsite.note_text })"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-[#212121] hover:bg-black text-white">
					✏️ Edit Note
				</button>
				<button v-else-if="selectedWebsite.is_file" @click="downloadFile(selectedWebsite.file_id)"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-[#212121] hover:bg-black text-white">
					📄 View File
				</button>
				<a v-else :href="selectedWebsite.url" target="_blank"
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
						<p class="text-sm mt-1 capitalize" :style="{ color: currentTheme.colors.textSecondary }">
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
			v1.1.0
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
					<button v-if="compatibilityResults.overall === 'success'" @click="dismissCompatibilityCheck"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all bg-green-500 hover:bg-green-600 text-white">
						✓ Continue to Rocus
					</button>
					<button v-else-if="compatibilityResults.overall === 'error'" @click="dismissCompatibilityCheck"
						class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
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
							Current version: v1.1.0 (Beta)
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
	<PremiumUpsell />


</template>

<script setup>
import {
	ref,
	computed,
	onMounted,
	onBeforeUnmount,
	watch,
	onUnmounted,
} from "vue";
import { useAnalytics } from '../composables/useAnalytics';
import PremiumUpsell from './PremiumUpsell.vue';

import { formatDate, withAlpha } from '../composables/graphNode/utils';

import {
	showBanner,
	promptConsent,
	accept,
	decline,
	toggleAnalytics,
} from '../composables/graphNode/useAnalyticsBanner';

import {
	showCompatibilityCheck,
	compatibilityResults,
	checkSystemCompatibility,
	runCompatibilityCheckIfNeeded,
	notifyCompatibilityCheckDismissed,
} from '../composables/graphNode/useCompatibilityCheck';

import { platform, detectPlatform, initDB, checkAndRepairDatabase } from '../composables/graphNode/useDatabase';

import {
	themes,
	currentTheme,
	isDarkMode,
	showThemes,
	toggleThemes,
	closeThemes,
	previewTheme,
	applyTheme,
	loadThemePreference,
	toggleDarkMode,
	updateTheme,
} from '../composables/graphNode/useThemes';

import {
	searchInput,
	matchCount,
	isSearchFocused,
	searchInputRef,
	performSearch,
	clearSearch,
	focusSearch,
	handleSearchBlur,
	handleClickOutside,
	handleKeyDown,
} from '../composables/graphNode/useSearch';

import {
	albums,
	showAlbumsDropdown,
	showAlbumModal,
	editingAlbum,
	albumForm,
	iconOptions,
	iconUrls,
	getIconUrl,
	toggleAlbumsDropdown,
	selectAlbum,
	createNewAlbum,
	editAlbum,
	saveAlbum,
	deleteAlbum,
	closeAlbumModal,
} from '../composables/graphNode/useAlbums';

import {
	availableModels,
	selectedModel,
	modelLoading,
	loadingMessage,
	downloadProgress,
	error,
	showModelStatus,
	toggleModelStatus,
	closeModelStatus,
	embeddingModel,
	summarizationModel,
	processingQueue,
	processedCount,
	isProcessing,
	showNewDataNotification,
	queueProgress,
	loadModels,
	clearModelCache,
	setupMessageListener,
	processingMode,
	setProcessingMode,
} from '../composables/graphNode/useAIModels';

import {
	showDiscoverModal,
	isLoadingSimilar,
	similarWebsites,
	closeDiscoverModal,
	openExternalLink,
} from '../composables/graphNode/useDiscover';

import {
	tutorialActive,
	tutorialStep,
	tutorialHighlightRect,
	tutorialSteps,
	startTutorial,
	startTutorialEmpty,
	nextTutorialStep,
	previousTutorialStep,
	skipTutorial,
	updateTutorialHighlight,
} from '../composables/graphNode/useTutorial';

import {
	importFileInput,
	exportAllData,
	triggerImport,
	handleImport,
} from '../composables/graphNode/useImportExport';

import {
	showRenameModal,
	renameInput,
	renameCluster,
	closeRenameModal,
	confirmRename,
	showAddWebsites,
	selectedWebsitesToAdd,
	availableWebsites,
	showAddWebsitesModal,
	closeAddWebsitesModal,
	toggleWebsiteSelection,
	confirmAddWebsites,
	showRemoveWebsites,
	selectedWebsitesToRemove,
	showRemoveWebsitesModal,
	closeRemoveWebsitesModal,
	toggleRemoveSelection,
	confirmRemoveWebsites,
	deleteCluster,
	showDeleteClusterModal,
	closeDeleteClusterModal,
	confirmDeleteCluster,
	showAddToAlbumModal,
	selectedAlbumForCluster,
	showAddToAlbumModalFunction,
	closeAddToAlbumModal,
	confirmAddToAlbum,
	showAddConnection,
	showRemoveConnection,
	selectedConnectionCluster,
	selectedConnectionToRemove,
	connectionSearchTerm,
	availableClustersForConnection,
	connectedClusters,
	showAddConnectionModal,
	closeAddConnectionModal,
	showRemoveConnectionModal,
	closeRemoveConnectionModal,
	confirmAddConnection,
	confirmRemoveConnection,
	showWebsiteEditModal,
	websiteTitleInput,
	editWebsiteTitle,
	closeWebsiteEditModal,
	confirmWebsiteEdit,
} from '../composables/graphNode/useClusterActions';

import {
	graphContainer,
	tooltip,
	isLoading,
	explodedNode,
	selectedWebsite,
	stickyNoteStyle,
	websiteDetails,
	showConnections,
	contextCluster,
	showContextMenu,
	contextMenuStyle,
	showWebsiteContextMenu,
	websites,
	settings,
	graphData,
	currentAlbum,
	dropdownMode,
	setDropdownMode,
	currentHistoryDay,
	loadFromIndexedDB,
	collapseNode,
	initializeGraph,
	resetView,
	toggleConnections,
	handleBackgroundClick,
	closeStickyNote,
	startDraggingSticky,
	deleteWebsite,
	refreshData,
	updateNodeSizes,
	updateConnections,
	handleResize,
} from '../composables/graphNode/useGraphEngine';

import { showVersionHistory, versionHistory } from '../composables/graphNode/useVersionHistory';

import { historyDays, selectHistoryDay, formatDayLabel } from '../composables/graphNode/useHistory';

import {
	showNoteModal,
	editingNoteId,
	noteForm,
	showAddNotePrompt,
	addNotePromptStyle,
	handleGraphLeftClick,
	handleGraphRightClick,
	confirmAddNoteFromPrompt,
	closeNoteModal,
	saveNote,
	openNoteEditor,
	noteSuggestions,
	selectedSuggestionClusterId,
	toggleSuggestion,
	NOTES_HUB_SENTINEL,
} from '../composables/graphNode/useNotes';

import {
	showDropOverlay,
	handleDragEnter,
	handleDragOver,
	handleDragLeave,
	handleDrop,
	showUploadsPanel,
	toggleUploadsPanel,
	uploadedFilesWithTopics,
	filesByTopic,
	downloadFile,
} from '../composables/graphNode/useFileUpload';

const { analyticsConsent, trackEvent } = useAnalytics();

// ==============================================
// SETTINGS MODAL (simple glue - kept here rather than a dedicated composable)
// ==============================================
const showSettings = ref(false);

function toggleSettings() {
	showSettings.value = !showSettings.value;
}

function closeSettings() {
	showSettings.value = false;
}

function dismissCompatibilityCheck() {
	notifyCompatibilityCheckDismissed();
}

// The embedding model (needed for both modes) loads briefly on every mount,
// but the header icon should only visibly spin for local mode, where the
// much heavier local WebLLM download is what's actually worth surfacing.
// Commercial-mode users see "ready" immediately rather than a loading flash
// for work they're not waiting on.
const showModelLoadingIndicator = computed(
	() => modelLoading.value && processingMode.value === 'local'
);

// CSS custom properties for the History/Albums dropdown's badge chips (see
// .cal-chip/.globe-chip below) - every color is pulled from currentTheme so
// the badges re-skin with the theme automatically instead of being
// hardcoded. Calendar chip accents off primary, globe chip off secondary,
// so the two badges read as distinct without introducing a third color.
const badgeVars = computed(() => {
	const c = currentTheme.value.colors;
	return {
		'--chip-surface': c.surface,
		'--chip-border': c.border,
		'--chip-text': c.text,
		'--chip-primary': c.primary,
		'--chip-secondary': c.secondary,
		'--chip-primary-tint': withAlpha(c.primary, 0.16),
		'--chip-primary-tint-strong': withAlpha(c.primary, 0.4),
		'--chip-secondary-tint-strong': withAlpha(c.secondary, 0.45),
	};
});

// currentHistoryDay (and each history list row's day.key) is a 'YYYY-MM-DD'
// key (see useGraphEngine.js's dayKeyFromISO) - parsing that directly as a
// bare date string gets read as UTC midnight by Date(), which can display a
// day early/late depending on the viewer's timezone offset, so it's pinned
// to local noon first.
function computeDayBadge(raw) {
	if (!raw) return { month: '', day: '' };
	const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
	if (isNaN(d)) return { month: '', day: '' };
	return {
		month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
		day: String(d.getDate()),
	};
}

const historyBadge = computed(() => computeDayBadge(currentHistoryDay.value));

// Works for any selected website-shaped record - a regular website, an
// uploaded file, or a note - deleteWebsite() already handles cluster
// cleanup uniformly regardless of what's stored on the record.
async function deleteSelectedWebsite() {
	if (!selectedWebsite.value) return;
	const label = selectedWebsite.value.is_note ? 'this note' : `"${selectedWebsite.value.title}"`;
	if (!confirm(`Delete ${label}? This can't be undone.`)) return;

	await deleteWebsite(selectedWebsite.value.websiteId);
	closeStickyNote();
	await refreshData();
}

// "All Clusters" is shared between the Albums and History views of the
// switcher dropdown, so it needs to clear whichever filter is active.
function selectAllClusters() {
	if (dropdownMode.value === 'history') {
		selectHistoryDay(null);
	} else {
		selectAlbum(null);
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

function handleProfileClick() {
	alert("Profile functionality would be implemented here");
}

// ==============================================
// LIFECYCLE
// ==============================================
let messageListener = null;

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

		// Only run the WebGPU/memory/IndexedDB readiness check for users
		// actually in local mode - irrelevant for commercial (cloud) mode,
		// which is the default and never touches the local model.
		if (processingMode.value === 'local') {
			await runCompatibilityCheckIfNeeded();
		}

		// Tutorial start no longer depends on the compatibility check - it's
		// gated purely on whether the user has seen it before.
		if (!tutorialCompleted) {
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

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
	if (!e.target.closest(".albums-dropdown-container")) {
		showAlbumsDropdown.value = false;
	}
	if (!e.target.closest(".uploads-panel-container")) {
		showUploadsPanel.value = false;
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

/* History/Albums dropdown badges - all colors come in via CSS custom
   properties set from currentTheme (see badgeVars in the script), so these
   re-skin automatically with every theme instead of being hardcoded. */
.cal-chip {
	width: 32px;
	height: 32px;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	overflow: hidden;
	border-radius: 9px;
	background: var(--chip-surface);
	border: 1px solid var(--chip-border);
	font-feature-settings: "tnum" 1;
	transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cal-chip::before {
	content: "";
	position: absolute;
	inset: 0 0 auto 0;
	height: 11px;
	background: var(--chip-primary-tint);
	border-bottom: 1px solid var(--chip-primary-tint-strong);
}

.cal-chip__m {
	position: relative;
	z-index: 1;
	height: 11px;
	line-height: 11px;
	font-size: 6.5px;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-indent: 0.12em;
	color: var(--chip-primary);
}

.cal-chip__d {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 13px;
	font-weight: 650;
	line-height: 1;
	letter-spacing: -0.02em;
	padding-bottom: 1px;
	color: var(--chip-text);
}

.globe-chip {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 1.25px solid var(--chip-border);
	position: relative;
	display: grid;
	place-items: center;
	transition: border-color 0.2s ease, transform 0.2s ease;
}

.globe-chip::before {
	content: "";
	position: absolute;
	left: 1px;
	right: 1px;
	top: 50%;
	height: 1.25px;
	transform: translateY(-50%);
	background: var(--chip-secondary-tint-strong);
}

.globe-chip i {
	width: 52%;
	height: 100%;
	border-radius: 50%;
	border: 1.25px solid var(--chip-secondary-tint-strong);
}

.group:hover .cal-chip {
	border-color: var(--chip-primary);
	transform: translateY(-1px);
	box-shadow: 0 2px 8px var(--chip-primary-tint);
}

.group:hover .globe-chip {
	border-color: var(--chip-secondary);
	transform: scale(1.04);
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
	text-transform: capitalize;
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

:global(.node.processing) {
	animation: pulse-processing 1.2s ease-in-out infinite;
	cursor: default;
}

@keyframes pulse-processing {

	0%,
	100% {
		opacity: 1;
		filter: drop-shadow(0 2px 12px rgba(245, 158, 11, 0.8));
	}

	50% {
		opacity: 0.35;
		filter: drop-shadow(0 4px 20px rgba(245, 158, 11, 0.3));
	}
}
</style>