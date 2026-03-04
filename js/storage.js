// Storage Operations

const storage = {
    async uploadFile(bucket, path, file) {
        const { data, error } = await supabaseClient
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
        const { data } = supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    async deleteFile(bucket, path) {
        const { error } = await supabaseClient
            .storage
            .from(bucket)
            .remove([path]);
        if (error) throw error;
    }
};
