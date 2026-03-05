// js/database.js - Database Operations

console.log('Loading database.js...');

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

    async create
