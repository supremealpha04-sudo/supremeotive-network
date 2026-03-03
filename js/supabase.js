// Supabase Configuration
const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';

// Initialize Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth Helpers
const auth = {
    async signUp(email, password, userData) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Database Helpers
const db = {
    // Profiles
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Posts
    async getPosts() {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:created_by(name, profile_image_url),
                likes_count:likes(count),
                comments_count:comments(count)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Check if user liked each post
        if (user) {
            const { data: likes } = await supabase
                .from('likes')
                .select('post_id')
                .eq('user_id', user.id);
            
            const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
            data.forEach(post => {
                post.is_liked = likedPostIds.has(post.id);
            });
        }
        
        return data;
    },

    async createPost(post) {
        const { data, error } = await supabase
            .from('posts')
            .insert(post)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updatePost(id, updates) {
        const { data, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deletePost(id) {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async toggleLike(postId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Check if already liked
        const { data: existing } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            await supabase.from('likes').delete().eq('id', existing.id);
            return false;
        } else {
            await supabase.from('likes').insert({
                post_id: postId,
                user_id: user.id
            });
            return true;
        }
    },

    // Comments
    async getComments(postId) {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id(name, profile_image_url)
            `)
            .eq('post_id', postId)
            .is('parent_comment_id', null)
            .order('created_at', { ascending: true });
        
        if (error) throw error;

        // Get replies for each comment
        for (let comment of data) {
            const { data: replies } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id(name, profile_image_url)
                `)
                .eq('parent_comment_id', comment.id)
                .order('created_at', { ascending: true });
            
            comment.replies = replies || [];
        }

        return data;
    },

    async addComment(comment) {
        const { data, error } = await supabase
            .from('comments')
            .insert(comment)
            .select(`
                *,
                profiles:user_id(name, profile_image_url)
            `)
            .single();
        if (error) throw error;
        return data;
    },

    async deleteComment(id) {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // eBooks
    async getEbooks() {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('ebooks')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        // Check unlocks for current user
        if (user) {
            const { data: unlocks } = await supabase
                .from('unlocks')
                .select('ebook_id')
                .eq('user_id', user.id);
            
            const unlockedIds = new Set(unlocks?.map(u => u.ebook_id) || []);
            data.forEach(ebook => {
                ebook.is_unlocked = unlockedIds.has(ebook.id);
            });
        }

        return data;
    },

    async createEbook(ebook) {
        const { data, error } = await supabase
            .from('ebooks')
            .insert(ebook)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateEbook(id, updates) {
        const { data, error } = await supabase
            .from('ebooks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteEbook(id) {
        const { error } = await supabase
            .from('ebooks')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Unlocks
    async requestUnlock(ebookId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('unlock_requests')
            .insert({
                user_id: user.id,
                ebook_id: ebookId,
                status: 'pending'
            });
        if (error) throw error;
    },

    async approveUnlock(userId, ebookId) {
        // Add to unlocks
        await supabase.from('unlocks').insert({
            user_id: userId,
            ebook_id: ebookId
        });
        
        // Update request status
        await supabase
            .from('unlock_requests')
            .update({ status: 'approved' })
            .eq('user_id', userId)
            .eq('ebook_id', ebookId);
    },

    async rejectUnlock(userId, ebookId) {
        await supabase
            .from('unlock_requests')
            .update({ status: 'rejected' })
            .eq('user_id', userId)
            .eq('ebook_id', ebookId);
    },

    async revokeUnlock(userId, ebookId) {
        await supabase
            .from('unlocks')
            .delete()
            .eq('user_id', userId)
            .eq('ebook_id', ebookId);
    },

    async getPendingRequests() {
        const { data, error } = await supabase
            .from('unlock_requests')
            .select(`
                *,
                profiles:user_id(name, email),
                ebooks:ebook_id(title, price)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAllUnlocks() {
        const { data, error } = await supabase
            .from('unlocks')
            .select(`
                *,
                profiles:user_id(name),
                ebooks:ebook_id(title)
            `)
            .order('unlocked_at', { ascending: false });
        if (error) throw error;
        return data;
    }
};

// Storage Helpers
const storage = {
    async uploadFile(bucket, path, file) {
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
        if (error) throw error;
        return data;
    },

    async getPublicUrl(bucket, path) {
        const { data } = supabase
            .storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    async deleteFile(bucket, path) {
        const { error } = await supabase
            .storage
            .from(bucket)
            .remove([path]);
        if (error) throw error;
    }
};
