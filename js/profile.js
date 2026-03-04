// Profile Logic

async function showProfile() {
    setContentScreen('profile-screen');
    await loadProfile();
}

async function loadProfile() {
    if (!currentProfile) return;

    document.getElementById('profile-name').textContent = currentProfile.name;
    document.getElementById('profile-role').textContent = currentProfile.role;
    document.getElementById('profile-email').textContent = currentProfile.email;
    document.getElementById('profile-country').textContent = currentProfile.country;
    document.getElementById('profile-age').textContent = `${currentProfile.age} years old`;
    document.getElementById('profile-joined').textContent = `Joined ${utils.formatDate(currentProfile.created_at)}`;

    if (currentProfile.profile_image_url) {
        document.getElementById('profile-image').src = currentProfile.profile_image_url;
        document.getElementById('profile-image').classList.remove('hidden');
        document.getElementById('profile-avatar-placeholder').classList.add('hidden');
    } else {
        document.getElementById('profile-image').classList.add('hidden');
        document.getElementById('profile-avatar-placeholder').classList.remove('hidden');
    }

    if (currentProfile.bio) {
        document.getElementById('profile-bio').textContent = currentProfile.bio;
        document.getElementById('profile-bio-container').classList.remove('hidden');
    } else {
        document.getElementById('profile-bio-container').classList.add('hidden');
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const ext = file.name.split('.').pop();
        const path = `profiles/${currentUser.id}/${utils.generateId()}.${ext}`;
        
        await storage.uploadFile('images', path, file);
        const url = await storage.getPublicUrl('images', path);
        
        await db.updateProfile(currentUser.id, { profile_image_url: url });
        currentProfile.profile_image_url = url;
        
        await loadProfile();
        showToast('Profile picture updated', 'success');
    } catch (error) {
        showToast('Failed to upload image', 'error');
    }
}

function showEditProfile() {
    document.getElementById('edit-name').value = currentProfile.name;
    document.getElementById('edit-bio').value = currentProfile.bio || '';
    setContentScreen('edit-profile-screen');
}

// Edit profile form handler
document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const name = document.getElementById('edit-name').value;
                const bio = document.getElementById('edit-bio').value;
                
                await db.updateProfile(currentUser.id, { name, bio: bio || null });
                currentProfile.name = name;
                currentProfile.bio = bio;
                
                await loadProfile();
                showProfile();
                showToast('Profile updated', 'success');
            } catch (error) {
                showToast('Failed to update profile', 'error');
            }
        });
    }
});
