// Database Operations

const db = {
    // Profiles
    async getProfile(userId) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getAllProfiles() {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Posts
    async getPosts() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const { data, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                profiles:created_by(name, profile_image_url),
                likes_count:likes(count),
                comments_count:comments(count)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (user && data) {
            const { data: likes } = await supabaseClient
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
        const { data, error } = await supabaseClient
            .from('posts')
            .insert(post)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updatePost(id, updates) {
        const { data, error } = await supabaseClient
            .from('posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deletePost(id) {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async toggleLike(postId) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: existing } = await supabaseClient
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            await supabaseClient.from('likes').delete().eq('id', existing.id);
            return false;
        } else {
            await supabaseClient.from('likes').insert({
                post_id: postId,
                user_id: user.id
            });
            return true;
        }
    },

    // Comments
    async getComments(postId) {
        const { data, error } = await supabaseClient
            .from('comments')
            .select(`
                *,
                profiles:user_id(name, profile_image_url)
            `)
            .eq('post_id', postId)
            .is('parent_comment_id', null)
            .order('created_at', { ascending: true });
        
        if (error) throw error;

        for (let comment of data) {
            const { data: replies } = await supabaseClient
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
        const { data, error } = await supabaseClient
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
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // eBooks
    async getEbooks() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const { data, error } = await supabaseClient
            .from('ebooks')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        if (user && data) {
            const { data: unlocks } = await supabaseClient
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
        const { data, error } = await supabaseClient
            .from('ebooks')
            .insert(ebook)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateEbook(id, updates) {
        const { data, error } = await supabaseClient
            .from('ebooks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteEbook(id) {
        const { error } = await supabaseClient
            .from('ebooks')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Unlocks
    async requestUnlock(ebookId) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { error } = await supabaseClient
            .from('unlock_requests')
            .insert({
                user_id: user.id,
                ebook_id: ebookId,
                status: 'pending'
            });
        if (error) throw error;
    },

    async approveUnlock(userId, ebookId) {
        await supabaseClient.from('unlocks').insert({
            user_id: userId,
            ebook_id: ebookId
        });
        
        await supabaseClient
            .from('unlock_requests')
            .update({ status: 'approved' })
            .eq('user_id', userId)
            .eq('ebook_id', ebookId);
    },

    async rejectUnlock(userId, ebookId) {
        await supabaseClient
            .from('unlock_requests')
            .update({ status: 'rejected' })
            .eq('user_id', userId)
            .eq('ebook_id', ebookId);
    },

    async revokeUnlock(userId, ebookId) {
        await supabaseClient
            .from('unlocks')
            .delete()
            .eq('user_id', userId)
            .eq('ebook_id', ebookId);
    },

    async getPendingRequests() {
        const { data, error } = await supabaseClient
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
        const { data, error } = await supabaseClient
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
